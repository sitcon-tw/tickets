"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { EventDashboardData } from "@sitcontix/types";
import { Activity, Banknote, CircleCheck, CircleX, Clock, PieChart, Share2, Ticket, UserCheck, Users, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { DistributionChart, TrendChart } from "./dashboard-charts";

type AdminDashboardContentProps = {
	dashboardData: EventDashboardData;
	locale: string;
	t: Record<string, string>;
};

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
	neutral: "bg-muted text-muted-foreground",
	success: "bg-green-500/10 text-green-700 dark:text-green-400",
	warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	danger: "bg-red-500/10 text-red-700 dark:text-red-400",
	info: "bg-blue-500/10 text-blue-700 dark:text-blue-400"
};

function StatCard({ icon: Icon, label, value, hint, tone = "neutral", className }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: Tone; className?: string }) {
	return (
		<div className={cn("rounded-xl border bg-card p-4", className)}>
			<div className="flex items-center justify-between gap-2">
				<p className="text-sm font-medium text-muted-foreground">{label}</p>
				<span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
					<Icon className="size-4" />
				</span>
			</div>
			<p className="mt-2 truncate text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">{value}</p>
			{hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
	return (
		<section className={cn("rounded-xl border bg-card p-4 sm:p-6", className)}>
			<h2 className="mb-4 text-lg font-semibold">{title}</h2>
			{children}
		</section>
	);
}

function getTicketName(ticket: EventDashboardData["tickets"][number], locale: string) {
	return ticket.name[locale] || ticket.name["zh-Hant"] || ticket.name["en"] || Object.values(ticket.name)[0] || "-";
}

export function AdminDashboardContent({ dashboardData, locale, t }: AdminDashboardContentProps) {
	const { stats, tickets, registrationTrends, referralStats } = dashboardData;

	const formatCurrency = useMemo(() => {
		const formatter = new Intl.NumberFormat(locale, { style: "currency", currency: "TWD", maximumFractionDigits: 0 });
		return (amount: number) => formatter.format(amount);
	}, [locale]);
	const formatNumber = useMemo(() => {
		const formatter = new Intl.NumberFormat(locale);
		return (value: number) => formatter.format(value);
	}, [locale]);

	const ticketNames = useMemo(() => tickets.map(ticket => getTicketName(ticket, locale)), [tickets, locale]);
	const soldCounts = useMemo(() => tickets.map(ticket => ticket.soldCount), [tickets]);
	const hasSales = soldCounts.some(count => count > 0);

	const confirmedShare = stats.totalRegistrations > 0 ? `${((stats.confirmedRegistrations / stats.totalRegistrations) * 100).toFixed(0)}%` : undefined;

	const ticketsAction = (
		<Button asChild size="sm" variant="secondary">
			<Link href="/admin/tickets">{t.manageTickets}</Link>
		</Button>
	);

	return (
		<div className="space-y-6">
			<section aria-label={t.statistics} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
				<StatCard icon={Users} label={t.totalRegistrations} value={formatNumber(stats.totalRegistrations)} />
				<StatCard icon={CircleCheck} tone="success" label={t.confirmed} value={formatNumber(stats.confirmedRegistrations)} hint={confirmedShare} />
				<StatCard icon={Clock} tone="warning" label={t.pending} value={formatNumber(stats.pendingRegistrations)} />
				<StatCard icon={CircleX} tone="danger" label={t.cancelled} value={formatNumber(stats.cancelledRegistrations)} />
				<StatCard icon={Banknote} tone="info" label={t.totalRevenue} value={formatCurrency(stats.totalRevenue)} className="col-span-2 lg:col-span-1" />
			</section>

			<div className="grid gap-6 lg:grid-cols-5">
				<Section title={t.salesTrend} className="lg:col-span-3">
					{registrationTrends.length > 0 ? (
						<TrendChart trends={registrationTrends} totalLabel={t.totalRegistrations} confirmedLabel={t.confirmed} ariaLabel={t.salesTrend} />
					) : (
						<EmptyState icon={Activity} title={t.noTrendData} description={t.noTrendDataHint} className="py-10" />
					)}
				</Section>

				<Section title={t.ticketDistribution} className="lg:col-span-2">
					{hasSales ? (
						<DistributionChart names={ticketNames} counts={soldCounts} unit={t.ticketsUnit} ariaLabel={t.ticketDistribution} />
					) : (
						<EmptyState icon={PieChart} title={t.noSalesData} description={t.noSalesDataHint} className="py-10" />
					)}
				</Section>
			</div>

			<Section title={t.ticketDetails}>
				{tickets.length > 0 ? (
					<div className="-mx-4 sm:-mx-6">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="h-10 pl-4 sm:pl-6">{t.ticketName}</TableHead>
									<TableHead className="h-10 text-right">{t.price}</TableHead>
									<TableHead className="h-10 text-right">{t.sold}</TableHead>
									<TableHead className="h-10 text-right">{t.available}</TableHead>
									<TableHead className="h-10 text-right">{t.total}</TableHead>
									<TableHead className="h-10 min-w-40">{t.salesRate}</TableHead>
									<TableHead className="h-10 pr-4 text-right sm:pr-6">{t.revenue}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tickets.map((ticket, index) => {
									const rate = ticket.quantity > 0 ? Math.min(100, (ticket.soldCount / ticket.quantity) * 100) : 0;
									return (
										<TableRow key={ticket.id}>
											<TableCell className="py-3 pl-4 font-medium sm:pl-6">{ticketNames[index]}</TableCell>
											<TableCell className="py-3 text-right tabular-nums">{formatCurrency(ticket.price)}</TableCell>
											<TableCell className="py-3 text-right font-semibold tabular-nums">{formatNumber(ticket.soldCount)}</TableCell>
											<TableCell className="py-3 text-right tabular-nums text-muted-foreground">{formatNumber(ticket.available)}</TableCell>
											<TableCell className="py-3 text-right tabular-nums text-muted-foreground">{formatNumber(ticket.quantity)}</TableCell>
											<TableCell className="py-3">
												<div className="flex items-center gap-3">
													<Progress value={rate} className="flex-1" />
													<span className="w-12 text-right text-sm tabular-nums">{rate.toFixed(rate % 1 === 0 ? 0 : 1)}%</span>
												</div>
											</TableCell>
											<TableCell className="py-3 pr-4 text-right font-semibold tabular-nums sm:pr-6">{formatCurrency(ticket.revenue)}</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<EmptyState icon={Ticket} title={t.noTickets} description={t.noTicketsHint} action={ticketsAction} className="py-10" />
				)}
			</Section>

			<Section title={t.referralStats}>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
					<StatCard icon={Share2} label={t.totalReferrals} value={formatNumber(referralStats.totalReferrals)} />
					<StatCard icon={UserCheck} label={t.activeReferrers} value={formatNumber(referralStats.activeReferrers)} />
					<StatCard icon={Activity} label={t.conversionRate} value={formatNumber(referralStats.conversionRate)} />
				</div>
			</Section>
		</div>
	);
}
