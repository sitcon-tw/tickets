"use client";

import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { EmptyState } from "@/components/admin/EmptyState";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEmailCampaignsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { EmailCampaign } from "@sitcontix/types";
import { Mail, RotateCw } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CampaignDialogs } from "./campaign-dialogs";
import { createCampaignsColumns } from "./columns";
import { buildTargetAudience, campaignsReducer, initialCampaignsState, type AudienceListField, type StatusFilter, type Template } from "./state";
import { campaignTranslations, fmt, getErrorMessage } from "./translations";

const POLL_INTERVAL_MS = 2000;
const STATUS_FILTERS: StatusFilter[] = ["all", "draft", "sending", "sent", "cancelled"];

export default function EmailCampaignsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();

	const [state, dispatch] = useReducer(campaignsReducer, initialCampaignsState);
	const { campaigns, isLoading, formData, tickets, statusFilter } = state;

	const t = useMemo(() => getTranslations(locale, campaignTranslations), [locale]);

	const contentRef = useRef<HTMLTextAreaElement>(null);
	const loadSeqRef = useRef(0);
	const previewSeqRef = useRef(0);
	const savingRef = useRef(false);
	const campaignsRef = useRef(campaigns);
	useEffect(() => {
		campaignsRef.current = campaigns;
	}, [campaigns]);

	// Campaign ids with a request in flight; guards against double clicks on send / cancel / preview.
	const busyRef = useRef(new Set<string>());
	const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(() => new Set());
	const acquire = useCallback((id: string) => {
		if (busyRef.current.has(id)) return false;
		busyRef.current.add(id);
		setBusyIds(new Set(busyRef.current));
		return true;
	}, []);
	const release = useCallback((id: string) => {
		busyRef.current.delete(id);
		setBusyIds(new Set(busyRef.current));
	}, []);

	const loadCampaigns = useCallback(
		async (silent = false) => {
			const seq = ++loadSeqRef.current;
			if (!silent) dispatch({ type: "setCampaignsLoading", value: true });
			try {
				const response = await adminEmailCampaignsAPI.getAll({ limit: 100 });
				if (seq !== loadSeqRef.current) return;
				if (response.success) {
					dispatch({ type: "campaignsLoaded", campaigns: response.data || [] });
				} else if (!silent) {
					showAlert(`${t.loadFailed}: ${response.message}`, "error");
				}
			} catch (error) {
				console.error("Failed to load campaigns:", error);
				if (!silent && seq === loadSeqRef.current) showAlert(`${t.loadFailed}: ${getErrorMessage(error)}`, "error");
			} finally {
				if (!silent) dispatch({ type: "setCampaignsLoading", value: false });
			}
		},
		[showAlert, t]
	);

	useEffect(() => {
		void loadCampaigns();
	}, [loadCampaigns]);

	useEffect(() => {
		void (async () => {
			try {
				const response = await adminEventsAPI.getAll();
				if (response.success) dispatch({ type: "eventsLoaded", events: response.data || [] });
			} catch (error) {
				console.error("Failed to load events:", error);
			}
		})();
		void (async () => {
			try {
				const response = await adminTicketsAPI.getAll();
				if (response.success) dispatch({ type: "ticketsLoaded", tickets: response.data || [] });
			} catch (error) {
				console.error("Failed to load tickets:", error);
			}
		})();
		void (async () => {
			try {
				const response = await adminEmailCampaignsAPI.getTemplates();
				if (response.success) dispatch({ type: "templatesLoaded", templates: response.data || [] });
			} catch (error) {
				console.error("Failed to load templates:", error);
			}
		})();
	}, []);

	// Poll every campaign that is currently "sending" (also resumes after a page reload).
	// The effect only restarts when the set of sending campaigns changes, and always clears its timer.
	const sendingKey = useMemo(
		() =>
			campaigns
				.filter(c => c.status === "sending")
				.map(c => c.id)
				.sort()
				.join(","),
		[campaigns]
	);
	useEffect(() => {
		if (!sendingKey) return;
		const ids = sendingKey.split(",");
		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const tick = async () => {
			let finished = false;
			await Promise.all(
				ids.map(async id => {
					try {
						const res = await adminEmailCampaignsAPI.getStatus(id);
						if (cancelled || !res.success) return;
						const { status, sentCount, totalRecipients, failedCount } = res.data;
						dispatch({ type: "patchCampaign", id, patch: { status: status as EmailCampaign["status"], sentCount, totalCount: totalRecipients } });
						if (status === "sending") return;
						finished = true;
						const name = campaignsRef.current.find(c => c.id === id)?.name ?? "";
						if (status === "sent") {
							if (failedCount > 0) showAlert(fmt(t.sendDonePartial, { name, count: sentCount, failed: failedCount }), "warning");
							else showAlert(fmt(t.sendDone, { name, count: sentCount }), "success");
						} else if (status === "draft") {
							showAlert(fmt(t.sendReset, { name }), "error");
						}
					} catch (error) {
						console.error("Polling error:", error);
					}
				})
			);
			if (finished) void loadCampaigns(true);
			if (cancelled) return;
			timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
		};

		timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [sendingKey, loadCampaigns, showAlert, t]);

	const visibleTickets = useMemo(() => {
		if (formData.targetAudience.eventIds.length === 0) return tickets;
		return tickets.filter(ticket => formData.targetAudience.eventIds.includes(ticket.eventId));
	}, [tickets, formData.targetAudience.eventIds]);

	const handlePreviewRecipients = async () => {
		const seq = ++previewSeqRef.current;
		dispatch({ type: "recipientPreviewStarted" });
		try {
			const response = await adminEmailCampaignsAPI.previewRecipients(buildTargetAudience(formData.targetAudience));
			if (seq !== previewSeqRef.current) return;
			if (response.success) {
				dispatch({ type: "recipientPreviewLoaded", count: response.data.recipientCount, recipients: response.data.recipients });
			} else {
				dispatch({ type: "recipientPreviewFailed" });
				showAlert(`${t.calcFailed}: ${response.message}`, "error");
			}
		} catch (error) {
			if (seq !== previewSeqRef.current) return;
			dispatch({ type: "recipientPreviewFailed" });
			showAlert(`${t.calcFailed}: ${getErrorMessage(error)}`, "error");
		}
	};

	const handleCreate = async () => {
		if (savingRef.current) return;
		if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
			showAlert(t.requiredFields, "warning");
			return;
		}
		savingRef.current = true;
		dispatch({ type: "setSaving", value: true });
		try {
			const response = await adminEmailCampaignsAPI.create({
				name: formData.name.trim(),
				subject: formData.subject.trim(),
				content: formData.content,
				targetAudience: buildTargetAudience(formData.targetAudience)
			});
			if (response.success) {
				dispatch({ type: "campaignCreated" });
				if (statusFilter !== "all" && statusFilter !== "draft") dispatch({ type: "setStatusFilter", value: "all" });
				void loadCampaigns(true);
				showAlert(t.createSuccess, "success");
			} else {
				showAlert(`${t.createFailed}: ${response.message}`, "error");
			}
		} catch (error) {
			showAlert(`${t.createFailed}: ${getErrorMessage(error)}`, "error");
		} finally {
			savingRef.current = false;
			dispatch({ type: "setSaving", value: false });
		}
	};

	const handlePreview = useCallback(
		async (campaign: EmailCampaign) => {
			if (!acquire(campaign.id)) return;
			try {
				const [previewRes, recipientsRes] = await Promise.allSettled([adminEmailCampaignsAPI.preview(campaign.id), adminEmailCampaignsAPI.calculateRecipients(campaign.id)]);
				if (previewRes.status === "rejected") throw previewRes.reason;
				if (!previewRes.value.success) {
					showAlert(`${t.previewFailed}: ${previewRes.value.message}`, "error");
					return;
				}
				const recipients = recipientsRes.status === "fulfilled" && recipientsRes.value.success ? recipientsRes.value.data.recipients : [];
				dispatch({ type: "previewLoaded", campaign, html: previewRes.value.data.previewHtml, recipients });
			} catch (error) {
				showAlert(`${t.previewFailed}: ${getErrorMessage(error)}`, "error");
			} finally {
				release(campaign.id);
			}
		},
		[acquire, release, showAlert, t]
	);

	const handleSend = useCallback(
		async (campaign: EmailCampaign) => {
			if (!acquire(campaign.id)) return;
			try {
				// Recalculate right now: the stored count can be stale if registrations changed since the draft was saved.
				const recipientsRes = await adminEmailCampaignsAPI.calculateRecipients(campaign.id);
				if (!recipientsRes.success) {
					showAlert(`${t.calcFailed}: ${recipientsRes.message}`, "error");
					return;
				}
				const count = recipientsRes.data.recipientCount;
				if (count === 0) {
					showAlert(t.noRecipients, "warning");
					return;
				}
				const ok = await confirm({
					title: t.sendConfirmTitle,
					description: fmt(t.sendConfirmDesc, { name: campaign.name, count }),
					confirmLabel: fmt(t.sendConfirmLabel, { count })
				});
				if (!ok) return;

				const response = await adminEmailCampaignsAPI.send(campaign.id);
				if (response.success) {
					dispatch({ type: "patchCampaign", id: campaign.id, patch: { status: "sending", sentCount: 0, totalCount: response.data.totalCount } });
					showAlert(fmt(t.sendStarted, { name: campaign.name, count: response.data.totalCount }), "info");
				} else {
					showAlert(`${t.sendFailed}: ${response.message}`, "error");
				}
				void loadCampaigns(true);
			} catch (error) {
				showAlert(`${t.sendFailed}: ${getErrorMessage(error)}`, "error");
				// The request may have reached the server despite the error (e.g. a timed out retry), so re-sync the status.
				void loadCampaigns(true);
			} finally {
				release(campaign.id);
			}
		},
		[acquire, release, confirm, loadCampaigns, showAlert, t]
	);

	const handleCancel = useCallback(
		async (campaign: EmailCampaign) => {
			if (!acquire(campaign.id)) return;
			try {
				const ok = await confirm({
					title: t.cancelConfirmTitle,
					description: fmt(t.cancelConfirmDesc, { name: campaign.name }),
					confirmLabel: t.cancelCampaign,
					cancelLabel: t.keep,
					destructive: true
				});
				if (!ok) return;
				const response = await adminEmailCampaignsAPI.cancel(campaign.id);
				if (response.success) {
					dispatch({ type: "patchCampaign", id: campaign.id, patch: { status: "cancelled" } });
					showAlert(t.cancelSuccess, "success");
				} else {
					showAlert(`${t.cancelFailed}: ${response.message}`, "error");
				}
				void loadCampaigns(true);
			} catch (error) {
				showAlert(`${t.cancelFailed}: ${getErrorMessage(error)}`, "error");
				void loadCampaigns(true);
			} finally {
				release(campaign.id);
			}
		},
		[acquire, release, confirm, loadCampaigns, showAlert, t]
	);

	const handleImportTemplate = async (template: Template) => {
		if (formData.content.trim()) {
			const ok = await confirm({ title: t.importTemplate, description: t.importTemplateOverwrite, confirmLabel: t.importTemplate });
			if (!ok) return;
		}
		dispatch({ type: "templateImported", content: template.content });
	};

	const insertVariable = (variable: string) => {
		const el = contentRef.current;
		if (!el) {
			dispatch({ type: "setFormField", field: "content", value: formData.content + variable });
			return;
		}
		const start = el.selectionStart ?? el.value.length;
		const end = el.selectionEnd ?? el.value.length;
		dispatch({ type: "setFormField", field: "content", value: el.value.slice(0, start) + variable + el.value.slice(end) });
		requestAnimationFrame(() => {
			el.focus();
			el.selectionStart = start + variable.length;
			el.selectionEnd = start + variable.length;
		});
	};

	const toggleCheckbox = (field: AudienceListField, id: string, checked: boolean) => {
		// Invalidate any recipient calculation still in flight for the previous filters.
		previewSeqRef.current++;
		dispatch({ type: "toggleTargetAudience", field, id, checked });
	};

	const statusCounts = useMemo(() => {
		const counts: Record<string, number> = { all: campaigns.length };
		for (const c of campaigns) counts[c.status] = (counts[c.status] || 0) + 1;
		return counts;
	}, [campaigns]);

	const filteredCampaigns = useMemo(() => (statusFilter === "all" ? campaigns : campaigns.filter(c => c.status === statusFilter)), [campaigns, statusFilter]);

	const columns = useMemo(() => createCampaignsColumns({ onPreview: handlePreview, onSend: handleSend, onCancel: handleCancel, busyIds, t }), [handlePreview, handleSend, handleCancel, busyIds, t]);

	const openCreate = () => dispatch({ type: "setCreateModal", value: true });

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.description}
				actions={
					<>
						<Button variant="outline" onClick={() => void loadCampaigns()} disabled={isLoading}>
							<RotateCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
							{t.refresh}
						</Button>
						<Button onClick={openCreate}>
							<Mail className="size-4" />
							{t.createNew}
						</Button>
					</>
				}
			/>

			<AdminToolbar>
				<Tabs value={statusFilter} onValueChange={value => dispatch({ type: "setStatusFilter", value: value as StatusFilter })} className="max-w-full overflow-x-auto">
					<TabsList>
						{STATUS_FILTERS.map(status => (
							<TabsTrigger key={status} value={status} className="px-3">
								{t[status]}
								<span className="text-xs tabular-nums text-muted-foreground">{statusCounts[status] || 0}</span>
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			</AdminToolbar>

			<DataTable
				columns={columns}
				data={filteredCampaigns}
				isLoading={isLoading && campaigns.length === 0}
				getRowId={row => row.id}
				emptyState={
					campaigns.length === 0 ? (
						<EmptyState
							icon={Mail}
							title={t.emptyTitle}
							description={t.emptyDescription}
							action={
								<Button onClick={openCreate}>
									<Mail className="size-4" />
									{t.createNew}
								</Button>
							}
						/>
					) : undefined
				}
				emptyMessage={t.emptyFiltered}
			/>

			<CampaignDialogs
				state={state}
				contentRef={contentRef}
				visibleTickets={visibleTickets}
				locale={locale}
				t={t}
				dispatch={dispatch}
				toggleCheckbox={toggleCheckbox}
				insertVariable={insertVariable}
				handlePreviewRecipients={handlePreviewRecipients}
				handleCreate={handleCreate}
				handleImportTemplate={handleImportTemplate}
			/>
		</main>
	);
}
