"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminWebhooksAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { type WebhookDelivery, type WebhookEndpoint } from "@sitcontix/types";
import { CalendarDays, Pencil, Plus, Webhook } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { FailedDeliveries } from "./failed-deliveries";
import { errorDetail, webhookTranslations, type WebhookT } from "./translations";
import { WebhookCard } from "./webhook-card";
import { WebhookDialog } from "./webhook-dialog";

type LoadedState = {
	eventId: string;
	webhook: WebhookEndpoint | null;
	deliveries: WebhookDelivery[];
	deliveriesError: boolean;
	error: boolean;
};

const DELIVERIES_LIMIT = 50;

function CardSkeleton() {
	return (
		<div className="space-y-4" aria-busy="true">
			<div className="h-72 animate-pulse rounded-xl border bg-muted/40" />
			<div className="h-40 animate-pulse rounded-xl border bg-muted/40" />
		</div>
	);
}

export default function WebhooksPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const t = getTranslations(locale, webhookTranslations) as WebhookT;

	const currentEventId = useSelectedEventId();
	const [loaded, setLoaded] = useState<LoadedState | null>(null);
	const [dialogEventId, setDialogEventId] = useState<string | null>(null);
	const [isToggling, setIsToggling] = useState(false);
	const [isRefreshingDeliveries, setIsRefreshingDeliveries] = useState(false);
	const [retryingId, setRetryingId] = useState<string | null>(null);

	// Guards against late responses from a previously selected event
	const activeEventRef = useRef<string | null>(currentEventId);
	const tRef = useRef(t);
	useEffect(() => {
		activeEventRef.current = currentEventId;
		tRef.current = t;
	});

	// A dialog opened for one event must not reappear when switching back to it later
	useEffect(() => {
		setDialogEventId(null);
	}, [currentEventId]);

	// State belongs to the event it was loaded for; anything else is treated as "not loaded yet"
	const current = loaded && loaded.eventId === currentEventId ? loaded : null;
	const webhook = current?.webhook ?? null;
	const dialogOpen = dialogEventId !== null && dialogEventId === currentEventId;

	const updateCurrent = useCallback((eventId: string, updater: (state: LoadedState) => LoadedState) => {
		setLoaded(prev => (prev && prev.eventId === eventId ? updater(prev) : prev));
	}, []);

	const fetchDeliveries = useCallback(async (eventId: string): Promise<{ deliveries: WebhookDelivery[]; error: boolean }> => {
		try {
			const response = await adminWebhooksAPI.getFailedDeliveries(eventId, { page: 1, limit: DELIVERIES_LIMIT });
			if (response.success && response.data) return { deliveries: response.data, error: false };
		} catch (error) {
			console.error("Failed to load failed deliveries:", error);
		}
		return { deliveries: [], error: true };
	}, []);

	const load = useCallback(
		async (eventId: string) => {
			try {
				const response = await adminWebhooksAPI.get(eventId);
				if (activeEventRef.current !== eventId) return;
				if (!response.success) {
					setLoaded({ eventId, webhook: null, deliveries: [], deliveriesError: false, error: true });
					showAlert(`${tRef.current.loadFailed}${response.message ? `: ${response.message}` : ""}`, "error");
					return;
				}

				const found = response.data ?? null;
				setLoaded({ eventId, webhook: found, deliveries: [], deliveriesError: false, error: false });
				if (found) {
					const result = await fetchDeliveries(eventId);
					if (activeEventRef.current !== eventId) return;
					updateCurrent(eventId, state => ({ ...state, deliveries: result.deliveries, deliveriesError: result.error }));
				}
			} catch (error) {
				console.error("Failed to load webhook:", error);
				if (activeEventRef.current !== eventId) return;
				setLoaded({ eventId, webhook: null, deliveries: [], deliveriesError: false, error: true });
				showAlert(`${tRef.current.loadFailed}${errorDetail(error)}`, "error");
			}
		},
		[fetchDeliveries, showAlert, updateCurrent]
	);

	useEffect(() => {
		if (currentEventId) void load(currentEventId);
	}, [currentEventId, load]);

	const handleRetryLoad = () => {
		if (!currentEventId) return;
		setLoaded(null);
		void load(currentEventId);
	};

	const handleRefreshDeliveries = async () => {
		if (!currentEventId) return;
		const eventId = currentEventId;
		setIsRefreshingDeliveries(true);
		const result = await fetchDeliveries(eventId);
		setIsRefreshingDeliveries(false);
		if (activeEventRef.current !== eventId) return;
		updateCurrent(eventId, state => ({ ...state, deliveries: result.deliveries, deliveriesError: result.error }));
	};

	const handleSaved = (saved: WebhookEndpoint) => {
		if (!currentEventId) return;
		const eventId = currentEventId;
		updateCurrent(eventId, state => ({ ...state, webhook: saved, error: false }));
		void handleRefreshDeliveries();
	};

	const handleToggleActive = async () => {
		if (!currentEventId || !webhook) return;
		const eventId = currentEventId;
		const nextActive = !webhook.isActive;

		setIsToggling(true);
		try {
			const response = await adminWebhooksAPI.update(eventId, { isActive: nextActive });
			if (response.success && response.data) {
				const updated = response.data;
				updateCurrent(eventId, state => ({ ...state, webhook: updated }));
				showAlert(nextActive ? t.enabledToast : t.disabledToast, "success");
			} else {
				showAlert(`${t.updateFailed}${response.message ? `: ${response.message}` : ""}`, "error");
			}
		} catch (error) {
			showAlert(`${t.updateFailed}${errorDetail(error)}`, "error");
		} finally {
			setIsToggling(false);
		}
	};

	const handleDelete = async () => {
		if (!currentEventId || !webhook) return;
		const eventId = currentEventId;
		if (!(await confirm({ title: t.deleteWebhook, description: t.deleteConfirm, destructive: true }))) return;

		try {
			const response = await adminWebhooksAPI.delete(eventId);
			if (response.success) {
				updateCurrent(eventId, state => ({ ...state, webhook: null, deliveries: [], deliveriesError: false }));
				showAlert(t.deleted, "success");
			} else {
				showAlert(`${t.deleteFailed}${response.message ? `: ${response.message}` : ""}`, "error");
			}
		} catch (error) {
			showAlert(`${t.deleteFailed}${errorDetail(error)}`, "error");
		}
	};

	const handleRetryDelivery = async (deliveryId: string) => {
		if (!currentEventId) return;
		const eventId = currentEventId;

		setRetryingId(deliveryId);
		try {
			const response = await adminWebhooksAPI.retryDelivery(eventId, deliveryId);
			showAlert(response.success ? t.retrySuccess : t.retryFailed, response.success ? "success" : "error");
		} catch {
			showAlert(t.retryFailed, "error");
		} finally {
			setRetryingId(null);
		}
		await handleRefreshDeliveries();
	};

	const headerActions = webhook ? (
		<Button variant="outline" size="sm" onClick={() => setDialogEventId(currentEventId)}>
			<Pencil className="size-4" />
			{t.editWebhook}
		</Button>
	) : current && !current.error ? (
		<Button variant="primary" size="sm" onClick={() => setDialogEventId(currentEventId)}>
			<Plus className="size-4" />
			{t.createWebhook}
		</Button>
	) : undefined;

	let body;
	if (!currentEventId) {
		body = <EmptyState icon={CalendarDays} title={t.selectEvent} description={t.selectEventDesc} />;
	} else if (!current) {
		body = <CardSkeleton />;
	} else if (current.error) {
		body = (
			<EmptyState
				icon={Webhook}
				title={t.loadFailed}
				action={
					<Button variant="outline" size="sm" onClick={handleRetryLoad}>
						{t.tryAgain}
					</Button>
				}
			/>
		);
	} else if (!webhook) {
		body = (
			<EmptyState
				icon={Webhook}
				title={t.noWebhook}
				description={t.noWebhookDesc}
				action={
					<Button variant="primary" onClick={() => setDialogEventId(currentEventId)}>
						<Plus className="size-4" />
						{t.createWebhook}
					</Button>
				}
			/>
		);
	} else {
		body = (
			<div className="space-y-6">
				<WebhookCard webhook={webhook} t={t} isToggling={isToggling} onToggleActive={handleToggleActive} onEdit={() => setDialogEventId(currentEventId)} onDelete={handleDelete} />
				<FailedDeliveries
					deliveries={current.deliveries}
					t={t}
					isRefreshing={isRefreshingDeliveries}
					loadError={current.deliveriesError}
					retryingId={retryingId}
					canRetry={webhook.isActive}
					onRefresh={handleRefreshDeliveries}
					onRetry={handleRetryDelivery}
				/>
			</div>
		);
	}

	return (
		<main>
			<AdminHeader title={t.title} description={t.description} actions={headerActions} />
			{body}
			{currentEventId && (
				<WebhookDialog open={dialogOpen} onOpenChange={open => setDialogEventId(open ? currentEventId : null)} eventId={currentEventId} webhook={webhook} t={t} onSaved={handleSaved} />
			)}
		</main>
	);
}
