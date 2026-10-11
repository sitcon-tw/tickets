"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { Link } from "@/i18n/navigation";
import { adminAnalyticsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import type { EventDashboardData } from "@sitcontix/types";
import { CalendarDays, TriangleAlert } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useReducer, useState, useSyncExternalStore } from "react";
import { AdminDashboardContent } from "./admin-dashboard-content";

type DashboardState = {
	dashboardData: EventDashboardData | null;
	loading: boolean;
	failed: boolean;
};

type DashboardAction = { type: "loadStarted" } | { type: "dataLoaded"; data: EventDashboardData } | { type: "loadFailed" } | { type: "reset" };

const initialDashboardState: DashboardState = {
	dashboardData: null,
	loading: false,
	failed: false
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
	switch (action.type) {
		case "loadStarted":
			return { dashboardData: null, loading: true, failed: false };
		case "dataLoaded":
			return { dashboardData: action.data, loading: false, failed: false };
		case "loadFailed":
			return { dashboardData: null, loading: false, failed: true };
		case "reset":
			return initialDashboardState;
	}
}

const subscribeHydrated = () => () => {};

function DashboardSkeleton() {
	return (
		<div className="space-y-6" aria-busy="true">
			<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
				{Array.from({ length: 5 }, (_, index) => (
					<div key={index} className="h-28 animate-pulse rounded-xl border bg-muted/40" />
				))}
			</div>
			<div className="grid gap-6 lg:grid-cols-5">
				<div className="h-80 animate-pulse rounded-xl border bg-muted/40 lg:col-span-3" />
				<div className="h-80 animate-pulse rounded-xl border bg-muted/40 lg:col-span-2" />
			</div>
			<div className="h-56 animate-pulse rounded-xl border bg-muted/40" />
		</div>
	);
}

export default function AdminDashboard() {
	const locale = useLocale();
	const selectedEventId = useSelectedEventId() || "";
	const [{ dashboardData, loading, failed }, dispatchDashboard] = useReducer(dashboardReducer, initialDashboardState);
	const [reloadKey, setReloadKey] = useState(0);
	// The selected event lives in localStorage, so it is unknown until hydration finishes.
	const hydrated = useSyncExternalStore(
		subscribeHydrated,
		() => true,
		() => false
	);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理後台", en: "Event Dashboard" },
		noEventSelected: { "zh-Hant": "尚未選擇活動", en: "No event selected" },
		noEventSelectedHint: { "zh-Hant": "請在左側選單選擇要查看的活動。", en: "Pick an event from the sidebar to see its statistics." },
		statistics: { "zh-Hant": "報名統計", en: "Statistics" },
		totalRegistrations: { "zh-Hant": "總報名數", en: "Total Registrations" },
		confirmed: { "zh-Hant": "已確認", en: "Confirmed" },
		pending: { "zh-Hant": "待確認", en: "Pending" },
		cancelled: { "zh-Hant": "已取消", en: "Cancelled" },
		totalRevenue: { "zh-Hant": "總收入", en: "Total Revenue" },
		salesTrend: { "zh-Hant": "報名趨勢", en: "Registration Trend" },
		ticketDistribution: { "zh-Hant": "票券銷售分布", en: "Ticket Sales Distribution" },
		ticketsUnit: { "zh-Hant": "張", en: "tickets" },
		ticketDetails: { "zh-Hant": "票券銷售詳情", en: "Ticket Sales Details" },
		ticketName: { "zh-Hant": "票券名稱", en: "Ticket Name" },
		price: { "zh-Hant": "價格", en: "Price" },
		sold: { "zh-Hant": "已售", en: "Sold" },
		available: { "zh-Hant": "剩餘", en: "Available" },
		total: { "zh-Hant": "總數", en: "Total" },
		salesRate: { "zh-Hant": "銷售率", en: "Sales Rate" },
		revenue: { "zh-Hant": "收入", en: "Revenue" },
		referralStats: { "zh-Hant": "推薦統計", en: "Referral Stats" },
		totalReferrals: { "zh-Hant": "總推薦數", en: "Total Referrals" },
		activeReferrers: { "zh-Hant": "活躍推薦者", en: "Active Referrers" },
		conversionRate: { "zh-Hant": "轉換率", en: "Conversion Rate" },
		manageTickets: { "zh-Hant": "管理票券", en: "Manage Tickets" },
		viewRegistrations: { "zh-Hant": "查看報名", en: "View Registrations" },
		noTrendData: { "zh-Hant": "近 30 天沒有報名紀錄", en: "No registrations in the last 30 days" },
		noTrendDataHint: { "zh-Hant": "有人報名後，趨勢圖會顯示在這裡。", en: "The trend chart appears here once people register." },
		noSalesData: { "zh-Hant": "尚未售出任何票券", en: "No tickets sold yet" },
		noSalesDataHint: { "zh-Hant": "售出票券後，銷售分布會顯示在這裡。", en: "The sales distribution appears here once tickets sell." },
		noTickets: { "zh-Hant": "這個活動還沒有票券", en: "This event has no tickets yet" },
		noTicketsHint: { "zh-Hant": "建立票券後，就能在這裡追蹤銷售狀況。", en: "Create tickets to track sales here." },
		loadFailed: { "zh-Hant": "無法載入統計資料", en: "Failed to load statistics" },
		loadFailedHint: { "zh-Hant": "請檢查網路連線後再試一次。", en: "Check your connection and try again." },
		retry: { "zh-Hant": "重試", en: "Retry" }
	});

	useEffect(() => {
		if (!selectedEventId) {
			dispatchDashboard({ type: "reset" });
			return;
		}

		// Ignore responses that arrive after the selected event changed or the page unmounted.
		let cancelled = false;
		dispatchDashboard({ type: "loadStarted" });
		adminAnalyticsAPI
			.getEventDashboard(selectedEventId)
			.then(response => {
				if (cancelled) return;
				if (response.success && response.data) {
					dispatchDashboard({ type: "dataLoaded", data: response.data });
				} else {
					console.error("Failed to load dashboard data:", response.message);
					dispatchDashboard({ type: "loadFailed" });
				}
			})
			.catch(error => {
				if (cancelled) return;
				console.error("Dashboard initialization failed:", error);
				dispatchDashboard({ type: "loadFailed" });
			});

		return () => {
			cancelled = true;
		};
	}, [selectedEventId, reloadKey]);

	const eventName = dashboardData ? dashboardData.event.name[locale] || dashboardData.event.name["zh-Hant"] || dashboardData.event.name["en"] : undefined;

	const quickActions = selectedEventId ? (
		<>
			<Button asChild size="sm" variant="secondary">
				<Link href="/admin/registrations">{t.viewRegistrations}</Link>
			</Button>
			<Button asChild size="sm" variant="secondary">
				<Link href="/admin/tickets">{t.manageTickets}</Link>
			</Button>
		</>
	) : undefined;

	return (
		<main>
			<AdminHeader title={t.title} description={eventName} actions={quickActions} />

			{!hydrated ? (
				<DashboardSkeleton />
			) : !selectedEventId ? (
				<EmptyState icon={CalendarDays} title={t.noEventSelected} description={t.noEventSelectedHint} />
			) : loading ? (
				<DashboardSkeleton />
			) : failed ? (
				<EmptyState
					icon={TriangleAlert}
					title={t.loadFailed}
					description={t.loadFailedHint}
					action={
						<Button size="sm" variant="secondary" onClick={() => setReloadKey(key => key + 1)}>
							{t.retry}
						</Button>
					}
				/>
			) : dashboardData ? (
				<AdminDashboardContent dashboardData={dashboardData} locale={locale} t={t} />
			) : (
				<DashboardSkeleton />
			)}
		</main>
	);
}
