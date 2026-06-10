"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { adminAnalyticsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import type { EventDashboardData } from "@sitcontix/types";
import type { Chart as ChartInstance, TooltipItem } from "chart.js";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useReducer, useRef, useSyncExternalStore } from "react";
import { AdminDashboardContent } from "./admin-dashboard-content";

let chartModulePromise: Promise<typeof import("chart.js")> | null = null;

const subscribeHydrated = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

async function loadChartModule() {
	chartModulePromise ??= import("chart.js").then(module => {
		module.Chart.register(...module.registerables);
		return module;
	});
	return chartModulePromise;
}

type DashboardState = {
	dashboardData: EventDashboardData | null;
	loading: boolean;
};

type DashboardAction = { type: "loadStarted" } | { type: "loadFinished" } | { type: "dataLoaded"; data: EventDashboardData } | { type: "noEventSelected" };

const initialDashboardState: DashboardState = {
	dashboardData: null,
	loading: true
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
	switch (action.type) {
		case "loadStarted":
			return { ...state, loading: true };
		case "loadFinished":
			return { ...state, loading: false };
		case "dataLoaded":
			return { dashboardData: action.data, loading: false };
		case "noEventSelected":
			return { dashboardData: null, loading: false };
	}
}

export default function AdminDashboard() {
	const locale = useLocale();
	const router = useRouter();
	const { theme, resolvedTheme } = useTheme();

	const selectedEventId = useSelectedEventId() || "";
	const [{ dashboardData, loading }, dispatchDashboard] = useReducer(dashboardReducer, initialDashboardState);
	const mounted = useSyncExternalStore(subscribeHydrated, getClientHydrated, getServerHydrated);

	const trendsChartRef = useRef<HTMLCanvasElement | null>(null);
	const distributionChartRef = useRef<HTMLCanvasElement | null>(null);
	const chartsInstancesRef = useRef<ChartInstance[]>([]);

	const getThemeColors = useCallback(() => {
		const isDark = mounted && (resolvedTheme === "dark" || (!resolvedTheme && theme === "dark"));

		return {
			chartColors: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
			textColor: isDark ? "#f3f4f6" : "#1f2937",
			gridColor: isDark ? "#4b5563" : "#e5e7eb",
			tickColor: isDark ? "#d1d5db" : "#6b7280",
			tooltipBg: isDark ? "#374151" : "#ffffff",
			tooltipBorder: isDark ? "#6b7280" : "#d1d5db",
			remainingColor: isDark ? "#E5E5E5" : "#e5e7eb"
		};
	}, [mounted, resolvedTheme, theme]);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "活動管理後台", "zh-Hans": "活动管理后台", en: "Event Dashboard" },
		noEventSelected: { "zh-Hant": "請在左側選擇活動", "zh-Hans": "请在左侧选择活动", en: "Please select an event from the sidebar" },
		statistics: { "zh-Hant": "報名統計", "zh-Hans": "报名统计", en: "Statistics" },
		totalRegistrations: { "zh-Hant": "總報名數", "zh-Hans": "总报名数", en: "Total Registrations" },
		confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
		pending: { "zh-Hant": "待確認", "zh-Hans": "待确认", en: "Pending" },
		cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
		totalRevenue: { "zh-Hant": "總收入", "zh-Hans": "总收入", en: "Total Revenue" },
		registrations: { "zh-Hant": "筆", "zh-Hans": "笔", en: "" },
		salesTrend: { "zh-Hant": "報名趨勢", "zh-Hans": "报名趋势", en: "Registration Trend" },
		ticketDistribution: { "zh-Hant": "票券銷售分布", "zh-Hans": "票券销售分布", en: "Ticket Sales Distribution" },
		ticketDetails: { "zh-Hant": "票券銷售詳情", "zh-Hans": "票券销售详情", en: "Ticket Sales Details" },
		ticketName: { "zh-Hant": "票券名稱", "zh-Hans": "票券名称", en: "Ticket Name" },
		price: { "zh-Hant": "價格", "zh-Hans": "价格", en: "Price" },
		sold: { "zh-Hant": "已售", "zh-Hans": "已售", en: "Sold" },
		available: { "zh-Hant": "剩餘", "zh-Hans": "剩余", en: "Available" },
		total: { "zh-Hant": "總數", "zh-Hans": "总数", en: "Total" },
		salesRate: { "zh-Hant": "銷售率", "zh-Hans": "销售率", en: "Sales Rate" },
		revenue: { "zh-Hant": "收入", "zh-Hans": "收入", en: "Revenue" },
		referralStats: { "zh-Hant": "推薦統計", "zh-Hans": "推荐统计", en: "Referral Stats" },
		totalReferrals: { "zh-Hant": "總推薦數", "zh-Hans": "总推荐数", en: "Total Referrals" },
		activeReferrers: { "zh-Hant": "活躍推薦者", "zh-Hans": "活跃推荐者", en: "Active Referrers" },
		conversionRate: { "zh-Hant": "轉換率", "zh-Hans": "转换率", en: "Conversion Rate" },
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
		quickActions: { "zh-Hant": "快速操作", "zh-Hans": "快速操作", en: "Quick Actions" },
		manageTickets: { "zh-Hant": "管理票券", "zh-Hans": "管理票券", en: "Manage Tickets" },
		viewRegistrations: { "zh-Hant": "查看報名", "zh-Hans": "查看报名", en: "View Registrations" },
		exportData: { "zh-Hant": "匯出資料", "zh-Hans": "导出资料", en: "Export Data" }
	});

	const loadDashboardData = useCallback(async () => {
		if (!selectedEventId) {
			dispatchDashboard({ type: "noEventSelected" });
			return;
		}

		dispatchDashboard({ type: "loadStarted" });
		try {
			const response = await adminAnalyticsAPI.getEventDashboard(selectedEventId);
			if (response.success && response.data) {
				dispatchDashboard({ type: "dataLoaded", data: response.data });
			} else {
				console.error("Failed to load dashboard data:", response.message);
				dispatchDashboard({ type: "loadFinished" });
			}
		} catch (error) {
			console.error("Dashboard initialization failed:", error);
			dispatchDashboard({ type: "loadFinished" });
		}
	}, [selectedEventId]);

	const destroyCharts = useCallback(() => {
		chartsInstancesRef.current.forEach(chart => chart.destroy());
		chartsInstancesRef.current = [];
	}, []);

	const initCharts = useCallback(async () => {
		if (!dashboardData) return;

		destroyCharts();

		const { Chart } = await loadChartModule();

		const themeColors = getThemeColors();
		const colors = themeColors.chartColors;

		if (trendsChartRef.current && dashboardData.registrationTrends.length > 0) {
			const ctx = trendsChartRef.current.getContext("2d");
			if (ctx) {
				const labels = dashboardData.registrationTrends.map(trend => {
					const date = new Date(trend.date);
					return `${date.getMonth() + 1}/${date.getDate()}`;
				});
				const counts = dashboardData.registrationTrends.map(trend => trend.count);
				const confirmed = dashboardData.registrationTrends.map(trend => trend.confirmed);

				const chart = new Chart(ctx, {
					type: "line",
					data: {
						labels: labels,
						datasets: [
							{
								label: locale === "zh-Hant" ? "總報名數" : locale === "zh-Hans" ? "总报名数" : "Total Registrations",
								data: counts,
								borderColor: colors[0],
								backgroundColor: colors[0] + "20",
								tension: 0.4,
								fill: true
							},
							{
								label: locale === "zh-Hant" ? "已確認" : locale === "zh-Hans" ? "已确认" : "Confirmed",
								data: confirmed,
								borderColor: colors[1],
								backgroundColor: colors[1] + "20",
								tension: 0.4,
								fill: true
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: true,
						plugins: {
							legend: {
								position: "bottom",
								labels: { color: themeColors.textColor }
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								title: {
									display: true,
									text: locale === "zh-Hant" ? "報名數量" : locale === "zh-Hans" ? "报名数量" : "Registration Count",
									color: themeColors.textColor
								},
								ticks: { color: themeColors.tickColor },
								grid: { color: themeColors.gridColor }
							},
							x: {
								title: {
									display: true,
									text: locale === "zh-Hant" ? "日期" : locale === "zh-Hans" ? "日期" : "Date",
									color: themeColors.textColor
								},
								ticks: { color: themeColors.tickColor },
								grid: { color: themeColors.gridColor }
							}
						}
					}
				});
				chartsInstancesRef.current.push(chart);
			}
		}

		// Doughnut Chart - Ticket Distribution
		if (distributionChartRef.current && dashboardData.tickets.length > 0) {
			const ctx = distributionChartRef.current.getContext("2d");
			if (ctx) {
				const ticketLabels = dashboardData.tickets.map(ticket => ticket.name[locale] || ticket.name["zh-Hant"] || ticket.name["en"] || "Unknown");
				const soldCounts = dashboardData.tickets.map(ticket => ticket.soldCount);

				const chart = new Chart(ctx, {
					type: "doughnut",
					data: {
						labels: ticketLabels,
						datasets: [
							{
								label: locale === "zh-Hant" ? "已售票券" : locale === "zh-Hans" ? "已售票券" : "Sold Tickets",
								data: soldCounts,
								backgroundColor: colors.slice(0, dashboardData.tickets.length),
								borderWidth: 2,
								borderColor: themeColors.tooltipBg
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: true,
						plugins: {
							legend: {
								position: "bottom",
								labels: { color: themeColors.textColor }
							},
							tooltip: {
								titleColor: themeColors.textColor,
								bodyColor: themeColors.textColor,
								backgroundColor: themeColors.tooltipBg,
								borderColor: themeColors.tooltipBorder,
								borderWidth: 1,
								callbacks: {
									label: function (context: TooltipItem<"doughnut">) {
										const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
										const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0";
										const ticketLabel = locale === "zh-Hant" ? "張" : locale === "zh-Hans" ? "张" : " tickets";
										return context.label + ": " + context.parsed + " " + ticketLabel + " (" + percentage + "%)";
									}
								}
							}
						}
					}
				});
				chartsInstancesRef.current.push(chart);
			}
		}
	}, [dashboardData, destroyCharts, locale, getThemeColors]);

	useEffect(() => {
		if (selectedEventId) {
			loadDashboardData();
		}
	}, [selectedEventId, loadDashboardData]);

	useEffect(() => {
		if (!loading && mounted && dashboardData) {
			void initCharts();
		}

		return () => {
			destroyCharts();
		};
	}, [loading, initCharts, mounted, dashboardData, destroyCharts]);

	const initChartsEvent = useEffectEvent(initCharts);

	useEffect(() => {
		if (!mounted || loading) return;

		const handleResize = () => {
			const timeoutId = setTimeout(() => {
				void initChartsEvent();
			}, 250);

			return () => clearTimeout(timeoutId);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [mounted, loading]);

	if (loading && !dashboardData) {
		return (
			<main>
				<AdminHeader title={t.statistics} />
				<div className="text-center p-12">
					<PageSpinner />
					<p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
				</div>
			</main>
		);
	}

	if (!selectedEventId) {
		return (
			<main>
				<AdminHeader title={t.title} />
				<div className="text-center p-12 text-gray-600 dark:text-gray-300">{t.noEventSelected}</div>
			</main>
		);
	}

	return (
		<main>
			<AdminHeader title={t.title} />

			{dashboardData && <AdminDashboardContent dashboardData={dashboardData} locale={locale} t={t} trendsChartRef={trendsChartRef} distributionChartRef={distributionChartRef} />}
		</main>
	);
}
