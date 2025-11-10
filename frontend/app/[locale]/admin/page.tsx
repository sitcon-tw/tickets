"use client";

import AdminHeader from "@/components/AdminHeader";
import { getTranslations } from "@/i18n/helpers";
import { adminAnalyticsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { DashboardData, RegistrationTrend, Ticket } from "@/lib/types/api";
import { Chart, registerables, TooltipItem } from "chart.js";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

// Register Chart.js components
if (typeof window !== "undefined") {
	Chart.register(...registerables);
}

export default function AdminDashboard() {
	const locale = useLocale();

	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [registrationTrends, setRegistrationTrends] = useState<RegistrationTrend[]>([]);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [loading, setLoading] = useState(true);

	// Chart refs
	const trendsChartRef = useRef<HTMLCanvasElement | null>(null);
	const distributionChartRef = useRef<HTMLCanvasElement | null>(null);
	const studentChartRef = useRef<HTMLCanvasElement | null>(null);
	const regularChartRef = useRef<HTMLCanvasElement | null>(null);
	const distantChartRef = useRef<HTMLCanvasElement | null>(null);
	const inviteChartRef = useRef<HTMLCanvasElement | null>(null);
	const opensourceChartRef = useRef<HTMLCanvasElement | null>(null);

	const chartsInstancesRef = useRef<Chart[]>([]);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "管理後台總覽", "zh-Hans": "管理后台总览", en: "Admin Dashboard" },
		overview: { "zh-Hant": "總覽", "zh-Hans": "总览", en: "Overview" },
		totalTickets: { "zh-Hant": "總票券數", "zh-Hans": "总票券数", en: "Total Tickets" },
		sold: { "zh-Hant": "已售出", "zh-Hans": "已售出", en: "Sold" },
		remaining: { "zh-Hant": "剩餘票券", "zh-Hans": "剩余票券", en: "Remaining Tickets" },
		salesRate: { "zh-Hant": "銷售率", "zh-Hans": "销售率", en: "Sales Rate" },
		tickets: { "zh-Hant": "張票券", "zh-Hans": "张票券", en: "tickets" },
		completion: { "zh-Hant": "完成度", "zh-Hans": "完成度", en: "Completion" },
		salesTrend: { "zh-Hant": "票券銷售趨勢", "zh-Hans": "票券销售趋势", en: "Ticket Sales Trend" },
		ticketDistribution: { "zh-Hant": "票券類型分布", "zh-Hans": "票券类型分布", en: "Ticket Type Distribution" },
		progressTitle: { "zh-Hant": "票券銷售進度", "zh-Hans": "票券销售进度", en: "Ticket Sales Progress" },
		student: { "zh-Hant": "學生票", "zh-Hans": "学生票", en: "Student Ticket" },
		regular: { "zh-Hant": "普通票", "zh-Hans": "普通票", en: "Regular Ticket" },
		distant: { "zh-Hant": "遠道而來票", "zh-Hans": "远道而来票", en: "Distant Ticket" },
		invite: { "zh-Hant": "邀請票", "zh-Hans": "邀请票", en: "Invite Ticket" },
		opensource: { "zh-Hant": "開源貢獻票", "zh-Hans": "开源贡献票", en: "Open Source Ticket" },
		remainingLabel: { "zh-Hant": "張剩餘", "zh-Hans": "张剩余", en: "remaining" },
		total: { "zh-Hant": "總數", "zh-Hans": "总数", en: "Total" },
		soldLabel: { "zh-Hant": "已售", "zh-Hans": "已售", en: "Sold" }
	});

	// Initialize dashboard
	const initializeDashboard = useCallback(async () => {
		try {
			const [dashboardResponse, trendsResponse, ticketsResponse] = await Promise.all([
				adminAnalyticsAPI.getDashboard(),
				adminAnalyticsAPI.getRegistrationTrends({ period: "daily" }),
				adminTicketsAPI.getAll()
			]);

			if (dashboardResponse.success && dashboardResponse.data) {
				setDashboardData(dashboardResponse.data);
			} else {
				console.error("Failed to load dashboard data:", dashboardResponse.message);
			}

			if (trendsResponse.success && trendsResponse.data) {
				console.log("Registration trends data:", trendsResponse.data);
				// The API returns data with a 'trends' property
				const trends = trendsResponse.data || [];
				setRegistrationTrends(trends);
			} else {
				console.error("Failed to load trends data:", trendsResponse.message);
			}

			if (ticketsResponse.success && ticketsResponse.data) {
				setTickets(ticketsResponse.data);
			} else {
				console.error("Failed to load tickets data:", ticketsResponse.message);
			}
		} catch (error) {
			console.error("Dashboard initialization failed:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Initialize charts
	const initCharts = useCallback(() => {
		// Clear existing charts
		chartsInstancesRef.current.forEach(chart => chart.destroy());
		chartsInstancesRef.current = [];

		const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

		// Line Chart - Registration Trends
		if (trendsChartRef.current) {
			const ctx = trendsChartRef.current.getContext("2d");
			if (ctx) {
				// Format dates and counts from registration trends
				// If no trends data, show empty chart
				const labels =
					registrationTrends.length > 0
						? registrationTrends.map(trend => {
								const date = new Date(trend.date);
								return `${date.getMonth() + 1}/${date.getDate()}`;
							})
						: [];
				const counts = registrationTrends.length > 0 ? registrationTrends.map(trend => trend.count || 0) : [];

				const chart = new Chart(ctx, {
					type: "line",
					data: {
						labels: labels,
						datasets: [
							{
								label: locale === "zh-Hant" ? "註冊數" : locale === "zh-Hans" ? "注册数" : "Registrations",
								data: counts,
								borderColor: colors[0],
								backgroundColor: colors[0] + "20",
								tension: 0.4,
								fill: true
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							legend: {
								position: "bottom",
								labels: { color: "#f3f4f6" }
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								title: {
									display: true,
									text: locale === "zh-Hant" ? "註冊數量" : locale === "zh-Hans" ? "注册数量" : "Registration Count",
									color: "#f3f4f6"
								},
								ticks: { color: "#d1d5db" },
								grid: { color: "#4b5563" }
							},
							x: {
								title: {
									display: true,
									text: locale === "zh-Hant" ? "日期" : locale === "zh-Hans" ? "日期" : "Date",
									color: "#f3f4f6"
								},
								ticks: { color: "#d1d5db" },
								grid: { color: "#4b5563" }
							}
						}
					}
				});
				chartsInstancesRef.current.push(chart);
			}
		}

		// Doughnut Chart - Ticket Distribution
		if (distributionChartRef.current && tickets.length > 0) {
			const ctx = distributionChartRef.current.getContext("2d");
			if (ctx) {
				const ticketLabels = tickets.map(ticket => ticket.name?.[locale] || ticket.name?.["zh-Hant"] || "Unknown");
				const soldCounts = tickets.map(ticket => ticket.soldCount || 0);

				const chart = new Chart(ctx, {
					type: "doughnut",
					data: {
						labels: ticketLabels,
						datasets: [
							{
								label: locale === "zh-Hant" ? "已售票券" : locale === "zh-Hans" ? "已售票券" : "Sold Tickets",
								data: soldCounts,
								backgroundColor: colors.slice(0, tickets.length),
								borderWidth: 2,
								borderColor: "#fff"
							}
						]
					},
					options: {
						responsive: true,
						plugins: {
							legend: {
								position: "bottom",
								labels: { color: "#f3f4f6" }
							},
							tooltip: {
								titleColor: "#f3f4f6",
								bodyColor: "#f3f4f6",
								backgroundColor: "#374151",
								borderColor: "#6b7280",
								borderWidth: 1,
								callbacks: {
									label: function (context: TooltipItem<"pie">) {
										const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
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

		// Progress Charts (Half Doughnut) - Use real ticket data
		const chartRefs = [studentChartRef, regularChartRef, distantChartRef, inviteChartRef, opensourceChartRef];

		tickets.forEach((ticket, index) => {
			const ref = chartRefs[index];
			if (ref && ref.current && index < chartRefs.length) {
				const ctx = ref.current.getContext("2d");
				if (ctx) {
					const soldCount = ticket.soldCount || 0;
					const total = ticket.quantity || 0;
					const percentage = total > 0 ? ((soldCount / total) * 100).toFixed(1) : "0";
					const remaining = total - soldCount;
					const color = colors[index % colors.length];

					const chart = new Chart(ctx, {
						type: "doughnut",
						data: {
							labels: [locale === "zh-Hant" ? "已售出" : locale === "zh-Hans" ? "已售出" : "Sold", locale === "zh-Hant" ? "剩餘" : locale === "zh-Hans" ? "剩余" : "Remaining"],
							datasets: [
								{
									data: [soldCount, remaining],
									backgroundColor: [color, "#E5E5E5"],
									borderWidth: 0
								}
							]
						},
						options: {
							responsive: true,
							maintainAspectRatio: false,
							// @ts-expect-error - Chart.js doughnut-specific options
							circumference: 180,
							rotation: 270,
							cutout: "70%",
							plugins: {
								legend: { display: false },
								tooltip: {
									titleColor: "#f3f4f6",
									bodyColor: "#f3f4f6",
									backgroundColor: "#374151",
									borderColor: "#6b7280",
									borderWidth: 1,
									callbacks: {
										label: function (context: TooltipItem<"doughnut">) {
											const ticketLabel = locale === "zh-Hant" ? "張" : locale === "zh-Hans" ? "张" : " tickets";
											return context.label + ": " + context.parsed + " " + ticketLabel;
										}
									}
								}
							}
						},
						plugins: [
							{
								id: "centerText",
								afterDraw: function (chart: Chart) {
									const ctx = chart.ctx;
									const width = chart.width;
									const height = chart.height;

									ctx.restore();
									const fontSize = (height / 100).toFixed(2);
									ctx.font = `bold ${fontSize}em sans-serif`;
									ctx.textBaseline = "middle";
									ctx.fillStyle = color;

									const text = percentage + "%";
									const textX = Math.round((width - ctx.measureText(text).width) / 2);
									const textY = height / 1.4;

									ctx.fillText(text, textX, textY);
									ctx.save();
								}
							}
						]
					});
					chartsInstancesRef.current.push(chart);
				}
			}
		});
	}, [registrationTrends, tickets, locale]);

	useEffect(() => {
		initializeDashboard();
	}, [initializeDashboard]);

	useEffect(() => {
		if (!loading) {
			initCharts();
		}

		return () => {
			chartsInstancesRef.current.forEach(chart => chart.destroy());
			chartsInstancesRef.current = [];
		};
	}, [loading, initCharts]);

	// Calculate actual ticket stats from tickets data
	const totalTicketQuantity = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
	const totalSold = tickets.reduce((sum, ticket) => sum + (ticket.soldCount || 0), 0);
	const remainingTickets = totalTicketQuantity - totalSold;
	const salesRate = totalTicketQuantity > 0 ? ((totalSold / totalTicketQuantity) * 100).toFixed(1) : "0";

	if (loading) {
		return (
			<main>
				<h1>{t.overview}</h1>
				<div className="text-center p-12 text-gray-300">{locale === "zh-Hant" ? "載入中..." : locale === "zh-Hans" ? "加载中..." : "Loading..."}</div>
			</main>
		);
	}

	return (
		<main>
			<AdminHeader title={t.overview} />
			<div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-12">
				<div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
					<h3 className="m-0 mb-4 text-gray-300 text-sm font-medium">{t.totalTickets}</h3>
					<div className="text-4xl font-bold text-gray-100 mb-2">{totalTicketQuantity}</div>
					<div className="text-gray-100 text-xs">{t.tickets}</div>
				</div>
				<div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
					<h3 className="m-0 mb-4 text-gray-300 text-sm font-medium">{t.sold}</h3>
					<div className="text-4xl font-bold text-gray-100 mb-2">{totalSold}</div>
					<div className="text-gray-100 text-xs">{t.tickets}</div>
				</div>
				<div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
					<h3 className="m-0 mb-4 text-gray-300 text-sm font-medium">{t.remaining}</h3>
					<div className="text-4xl font-bold text-gray-100 mb-2">{remainingTickets}</div>
					<div className="text-gray-100 text-xs">{t.tickets}</div>
				</div>
				<div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">
					<h3 className="m-0 mb-4 text-gray-300 text-sm font-medium">{t.salesRate}</h3>
					<div className="text-4xl font-bold text-gray-100 mb-2">{salesRate}%</div>
					<div className="text-gray-100 text-xs">{t.completion}</div>
				</div>
			</div>

			<div className="flex gap-8 mb-12 flex-wrap">
				<div className="bg-gray-800 p-6 rounded-lg shadow-md flex-2 max-w-full">
					<h2 className="m-0 mb-4 text-gray-100 text-xl">{t.salesTrend}</h2>
					<canvas ref={trendsChartRef} width="100%" height="50px"></canvas>
				</div>

				<div className="bg-gray-800 p-6 rounded-lg shadow-md flex-1 max-w-full">
					<h2 className="m-0 mb-4 text-gray-100 text-xl">{t.ticketDistribution}</h2>
					<canvas ref={distributionChartRef} width="100%" height="100%"></canvas>
				</div>
			</div>

			<div className="bg-gray-800 p-6 rounded-lg shadow-md">
				<h2 className="m-0 mb-6 text-gray-100 text-xl">{t.progressTitle}</h2>
				<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
					{tickets.slice(0, 5).map((ticket, idx) => {
						const chartRefs = [studentChartRef, regularChartRef, distantChartRef, inviteChartRef, opensourceChartRef];
						const ticketName = ticket.name?.[locale] || ticket.name?.["zh-Hant"] || "Unknown";
						const soldCount = ticket.soldCount || 0;
						const total = ticket.quantity || 0;
						const remaining = total - soldCount;

						return (
							<div key={idx} className="bg-gray-700 p-6 rounded-xl shadow-md text-center max-w-full">
								<h3 className="m-0 mb-6 text-gray-200 text-lg font-semibold">{ticketName}</h3>
								<div className="flex justify-center mb-4">
									<canvas ref={chartRefs[idx]} width="200" height="100"></canvas>
								</div>
								<div className="mb-6 p-4 bg-gray-600 rounded-lg">
									<div className="text-4xl font-bold text-gray-100 leading-none">{remaining}</div>
									<div className="text-sm text-gray-300 mt-1">{t.remainingLabel}</div>
								</div>
								<div className="flex justify-around gap-4">
									<div className="flex flex-col items-center gap-1">
										<span className="text-gray-300 text-sm font-medium">{t.total}</span>
										<span className="font-semibold text-gray-200 text-lg">{total}</span>
									</div>
									<div className="flex flex-col items-center gap-1">
										<span className="text-gray-300 text-sm font-medium">{t.soldLabel}</span>
										<span className="font-semibold text-gray-200 text-lg">{soldCount}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</main>
	);
}
