"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { getTranslations } from "@/i18n/helpers";
import { adminAnalyticsAPI } from "@/lib/api/endpoints";
import type { EventDashboardData } from "@sitcontix/types";
import { Chart, registerables, TooltipItem } from "chart.js";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

if (typeof window !== "undefined") {
	Chart.register(...registerables);
}

export default function AdminDashboard() {
	const locale = useLocale();
	const router = useRouter();
	const { theme, resolvedTheme } = useTheme();

	const [selectedEventId, setSelectedEventId] = useState<string>("");
	const [dashboardData, setDashboardData] = useState<EventDashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const [mounted, setMounted] = useState(false);

	const trendsChartRef = useRef<HTMLCanvasElement | null>(null);
	const distributionChartRef = useRef<HTMLCanvasElement | null>(null);
	const chartsInstancesRef = useRef<Chart[]>([]);

	useEffect(() => {
		setMounted(true);
	}, []);

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
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const response = await adminAnalyticsAPI.getEventDashboard(selectedEventId);
			if (response.success && response.data) {
				setDashboardData(response.data);
			} else {
				console.error("Failed to load dashboard data:", response.message);
			}
		} catch (error) {
			console.error("Dashboard initialization failed:", error);
		} finally {
			setLoading(false);
		}
	}, [selectedEventId]);

	const initCharts = useCallback(() => {
		if (!dashboardData) return;

		chartsInstancesRef.current.forEach(chart => chart.destroy());
		chartsInstancesRef.current = [];

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
	}, [dashboardData, locale, getThemeColors]);

	useEffect(() => {
		const savedEventId = localStorage.getItem("selectedEventId");
		if (savedEventId) {
			setSelectedEventId(savedEventId);
		}

		const handleEventChange = (event: CustomEvent) => {
			setSelectedEventId(event.detail.eventId);
		};

		window.addEventListener("selectedEventChanged" as any, handleEventChange);
		return () => {
			window.removeEventListener("selectedEventChanged" as any, handleEventChange);
		};
	}, []);

	useEffect(() => {
		if (selectedEventId) {
			loadDashboardData();
		}
	}, [selectedEventId, loadDashboardData]);

	useEffect(() => {
		if (!loading && mounted && dashboardData) {
			initCharts();
		}

		return () => {
			chartsInstancesRef.current.forEach(chart => chart.destroy());
			chartsInstancesRef.current = [];
		};
	}, [loading, initCharts, mounted, dashboardData]);

	useEffect(() => {
		if (!mounted || loading) return;

		const handleResize = () => {
			const timeoutId = setTimeout(() => {
				initCharts();
			}, 250);

			return () => clearTimeout(timeoutId);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [initCharts, mounted, loading]);

	useEffect(() => {
		if (!loading && mounted && dashboardData) {
			initCharts();
		}
	}, [resolvedTheme, theme, loading, mounted, dashboardData, initCharts]);

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

			{dashboardData && (
				<>
					{/* Stats Grid */}
					<section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-12">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.totalRegistrations}</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{dashboardData.stats.totalRegistrations}</div>
							<div className="text-gray-800 dark:text-gray-100 text-xs">{t.registrations}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.confirmed}</h3>
							<div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{dashboardData.stats.confirmedRegistrations}</div>
							<div className="text-gray-800 dark:text-gray-100 text-xs">{t.registrations}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.pending}</h3>
							<div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{dashboardData.stats.pendingRegistrations}</div>
							<div className="text-gray-800 dark:text-gray-100 text-xs">{t.registrations}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.totalRevenue}</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">NT$ {dashboardData.stats.totalRevenue.toLocaleString()}</div>
						</div>
					</section>

					{/* Charts */}
					<section className="flex gap-8 mb-12 flex-wrap">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md min-w-[300px] flex-1 border border-gray-200 dark:border-gray-700">
							<h2 className="m-0 mb-4 text-gray-900 dark:text-gray-100 text-xl">{t.salesTrend}</h2>
							<canvas ref={trendsChartRef} width="100%" height="50px"></canvas>
						</div>

						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex-1 min-w-[300px] border border-gray-200 dark:border-gray-700">
							<h2 className="m-0 mb-4 text-gray-900 dark:text-gray-100 text-xl">{t.ticketDistribution}</h2>
							<canvas ref={distributionChartRef} width="100%" height="100%"></canvas>
						</div>
					</section>

					{/* Ticket Details Table */}
					<section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-12 border border-gray-200 dark:border-gray-700">
						<h2 className="m-0 mb-6 text-gray-900 dark:text-gray-100 text-xl">{t.ticketDetails}</h2>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200 dark:border-gray-700">
										<th className="text-left p-3 text-gray-700 dark:text-gray-300">{t.ticketName}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.price}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.sold}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.available}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.total}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.salesRate}</th>
										<th className="text-right p-3 text-gray-700 dark:text-gray-300">{t.revenue}</th>
									</tr>
								</thead>
								<tbody>
									{dashboardData.tickets.map(ticket => (
										<tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-700">
											<td className="p-3 text-gray-900 dark:text-gray-100">{ticket.name[locale] || ticket.name["zh-Hant"] || ticket.name["en"] || "Unknown"}</td>
											<td className="text-right p-3 text-gray-700 dark:text-gray-300">NT$ {ticket.price.toLocaleString()}</td>
											<td className="text-right p-3 text-green-600 dark:text-green-400 font-semibold">{ticket.soldCount}</td>
											<td className="text-right p-3 text-gray-700 dark:text-gray-300">{ticket.available}</td>
											<td className="text-right p-3 text-gray-700 dark:text-gray-300">{ticket.quantity}</td>
											<td className="text-right p-3 text-gray-700 dark:text-gray-300">{ticket.salesRate}%</td>
											<td className="text-right p-3 text-gray-900 dark:text-gray-100 font-semibold">NT$ {ticket.revenue.toLocaleString()}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</section>

					{/* Referral Stats */}
					<section className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-12">
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.totalReferrals}</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{dashboardData.referralStats.totalReferrals}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.activeReferrers}</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{dashboardData.referralStats.activeReferrers}</div>
						</div>
						<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center border border-gray-200 dark:border-gray-700">
							<h3 className="m-0 mb-4 text-gray-600 dark:text-gray-300 text-sm font-medium">{t.conversionRate}</h3>
							<div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{dashboardData.referralStats.conversionRate}</div>
						</div>
					</section>
				</>
			)}
		</main>
	);
}
