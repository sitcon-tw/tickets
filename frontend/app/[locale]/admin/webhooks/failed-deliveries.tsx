"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils/timezone";
import { type WebhookDelivery } from "@sitcontix/types";
import { CheckCircle2, RefreshCw, RotateCw } from "lucide-react";
import { eventTypeLabel, type WebhookT } from "./translations";

const MAX_RETRIES = 3;

export function FailedDeliveries({
	deliveries,
	t,
	isRefreshing,
	loadError,
	retryingId,
	canRetry,
	onRefresh,
	onRetry
}: {
	deliveries: WebhookDelivery[];
	t: WebhookT;
	isRefreshing: boolean;
	loadError: boolean;
	retryingId: string | null;
	canRetry: boolean;
	onRefresh: () => void;
	onRetry: (deliveryId: string) => void;
}) {
	return (
		<section className="rounded-xl border bg-card">
			<div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-6">
				<div className="min-w-0">
					<h2 className="text-lg font-semibold">{t.failedDeliveries}</h2>
					<p className="mt-1 text-sm text-muted-foreground">{t.failedDeliveriesDesc}</p>
				</div>
				<Button variant="outline" size="sm" onClick={onRefresh} isLoading={isRefreshing}>
					{!isRefreshing && <RefreshCw className="size-4" />}
					{t.refresh}
				</Button>
			</div>

			{loadError ? (
				<div className="px-4 pb-4 sm:px-6 sm:pb-6">
					<EmptyState
						title={t.deliveriesLoadFailed}
						action={
							<Button variant="outline" size="sm" onClick={onRefresh}>
								{t.tryAgain}
							</Button>
						}
					/>
				</div>
			) : deliveries.length === 0 ? (
				<div className="px-4 pb-4 sm:px-6 sm:pb-6">
					<EmptyState icon={CheckCircle2} title={t.noFailedDeliveries} description={t.noFailedDeliveriesDesc} className="py-10" />
				</div>
			) : (
				<div className="overflow-x-auto border-t">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t.time}</TableHead>
								<TableHead>{t.eventType}</TableHead>
								<TableHead>{t.statusCode}</TableHead>
								<TableHead>{t.errorMessage}</TableHead>
								<TableHead>{t.retryCount}</TableHead>
								<TableHead className="text-right">{t.actions}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{deliveries.map(delivery => (
								<TableRow key={delivery.id}>
									<TableCell className="whitespace-nowrap">{formatDateTime(delivery.createdAt)}</TableCell>
									<TableCell>
										<StatusBadge tone="info" noDot>
											{eventTypeLabel(t, delivery.eventType)}
										</StatusBadge>
									</TableCell>
									<TableCell>{delivery.statusCode ? <StatusBadge tone="danger">{delivery.statusCode}</StatusBadge> : <span className="text-muted-foreground">-</span>}</TableCell>
									<TableCell className="max-w-xs truncate" title={delivery.errorMessage ?? undefined}>
										{delivery.errorMessage || "-"}
									</TableCell>
									<TableCell className="whitespace-nowrap">
										{delivery.retryCount}/{MAX_RETRIES}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="outline"
											size="sm"
											onClick={() => onRetry(delivery.id)}
											disabled={!canRetry || (retryingId !== null && retryingId !== delivery.id)}
											isLoading={retryingId === delivery.id}
											title={canRetry ? undefined : t.retryDisabledHint}
										>
											{retryingId !== delivery.id && <RotateCw className="size-4" />}
											{t.retry}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</section>
	);
}
