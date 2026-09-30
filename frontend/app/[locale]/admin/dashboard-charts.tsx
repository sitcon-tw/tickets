"use client";

import type { EventDashboardData } from "@sitcontix/types";
import type { Chart as ChartInstance, ChartConfiguration, TooltipItem } from "chart.js";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef } from "react";

let chartModulePromise: Promise<typeof import("chart.js")> | null = null;

function loadChartModule() {
	chartModulePromise ??= import("chart.js").then(module => {
		module.Chart.register(...module.registerables);
		return module;
	});
	return chartModulePromise;
}

type ChartTheme = {
	text: string;
	grid: string;
	surface: string;
	series: string[];
};

// Fixed hex values per theme: reading CSS variables here would race with next-themes toggling the root class.
const lightTheme: ChartTheme = {
	text: "#475569",
	grid: "rgba(100, 116, 139, 0.18)",
	surface: "#ffffff",
	series: ["#2563eb", "#0d9488", "#d97706", "#7c3aed", "#db2777", "#65a30d", "#0891b2", "#dc2626"]
};

const darkTheme: ChartTheme = {
	text: "#cbd5e1",
	grid: "rgba(148, 163, 184, 0.2)",
	surface: "#020817",
	series: ["#60a5fa", "#2dd4bf", "#fbbf24", "#a78bfa", "#f472b6", "#a3e635", "#22d3ee", "#f87171"]
};

function useChartTheme() {
	const { resolvedTheme } = useTheme();
	return resolvedTheme === "dark" ? darkTheme : lightTheme;
}

function withAlpha(hex: string, alpha: number) {
	const value = Number.parseInt(hex.slice(1), 16);
	return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function tooltipTheme(theme: ChartTheme) {
	return { backgroundColor: theme.surface, titleColor: theme.text, bodyColor: theme.text, borderColor: theme.grid, borderWidth: 1, padding: 10 };
}

type Trend = EventDashboardData["registrationTrends"][number];

/** Days without registrations are missing from the API response; fill them with zeros so the line does not skip over gaps. */
function fillTrendGaps(trends: Trend[]): Trend[] {
	if (trends.length === 0) return [];
	const byDate = new Map(trends.map(trend => [trend.date, trend]));
	const dates = trends.map(trend => trend.date).sort();
	const start = new Date(`${dates[0]}T00:00:00Z`);
	const end = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return trends;

	const filled: Trend[] = [];
	for (let day = start; day <= end; day = new Date(day.getTime() + 86400000)) {
		const date = day.toISOString().slice(0, 10);
		filled.push(byDate.get(date) ?? { date, count: 0, confirmed: 0 });
	}
	return filled;
}

function formatTrendLabel(date: string) {
	const [, month, day] = date.split("-");
	return month && day ? `${Number(month)}/${Number(day)}` : date;
}

function buildTrendConfig(points: Trend[], labels: { total: string; confirmed: string }, theme: ChartTheme): ChartConfiguration<"line"> {
	return {
		type: "line",
		data: {
			labels: points.map(point => formatTrendLabel(point.date)),
			datasets: [
				{
					label: labels.total,
					data: points.map(point => point.count),
					borderColor: theme.series[0],
					backgroundColor: withAlpha(theme.series[0], 0.12),
					tension: 0.35,
					fill: true,
					pointRadius: 2,
					pointHoverRadius: 5
				},
				{
					label: labels.confirmed,
					data: points.map(point => point.confirmed),
					borderColor: theme.series[1],
					backgroundColor: withAlpha(theme.series[1], 0.12),
					tension: 0.35,
					fill: true,
					pointRadius: 2,
					pointHoverRadius: 5
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { mode: "index", intersect: false },
			plugins: {
				legend: { position: "bottom", labels: { color: theme.text, usePointStyle: true, boxWidth: 8 } },
				tooltip: tooltipTheme(theme)
			},
			scales: {
				y: { beginAtZero: true, ticks: { color: theme.text, precision: 0 }, grid: { color: theme.grid } },
				x: { ticks: { color: theme.text, maxRotation: 0, autoSkipPadding: 12 }, grid: { display: false } }
			}
		}
	};
}

function applyTrendTheme(chart: ChartInstance<"line">, theme: ChartTheme) {
	chart.data.datasets.forEach((dataset, index) => {
		dataset.borderColor = theme.series[index];
		dataset.backgroundColor = withAlpha(theme.series[index], 0.12);
	});
	const cfg = buildTrendConfig([], { total: "", confirmed: "" }, theme);
	chart.options = cfg.options!;
	chart.update("none");
}

type TrendChartProps = {
	trends: Trend[];
	totalLabel: string;
	confirmedLabel: string;
	ariaLabel: string;
};

export function TrendChart({ trends, totalLabel, confirmedLabel, ariaLabel }: TrendChartProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const chartRef = useRef<ChartInstance<"line"> | null>(null);
	const theme = useChartTheme();
	const themeRef = useRef(theme);
	const points = useMemo(() => fillTrendGaps(trends), [trends]);

	// Recolor in place when the theme changes instead of re-creating the chart.
	useEffect(() => {
		themeRef.current = theme;
		if (chartRef.current) applyTrendTheme(chartRef.current, theme);
	}, [theme]);

	useEffect(() => {
		let cancelled = false;
		let chart: ChartInstance<"line"> | null = null;
		void loadChartModule().then(({ Chart }) => {
			const canvas = canvasRef.current;
			if (cancelled || !canvas) return;
			chart = new Chart(canvas, buildTrendConfig(points, { total: totalLabel, confirmed: confirmedLabel }, themeRef.current));
			chartRef.current = chart;
		});
		return () => {
			cancelled = true;
			chart?.destroy();
			chartRef.current = null;
		};
	}, [points, totalLabel, confirmedLabel]);

	return (
		<div className="relative h-64 w-full sm:h-72">
			<canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
		</div>
	);
}

function sliceColors(theme: ChartTheme, count: number) {
	return Array.from({ length: count }, (_, index) => theme.series[index % theme.series.length]);
}

function buildDistributionConfig(names: string[], counts: number[], unit: string, theme: ChartTheme): ChartConfiguration<"doughnut"> {
	return {
		type: "doughnut",
		data: {
			labels: names,
			datasets: [{ data: counts, backgroundColor: sliceColors(theme, counts.length), borderWidth: 2, borderColor: theme.surface }]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			cutout: "62%",
			plugins: {
				legend: { position: "bottom", labels: { color: theme.text, usePointStyle: true, boxWidth: 8 } },
				tooltip: {
					...tooltipTheme(theme),
					callbacks: {
						label: (context: TooltipItem<"doughnut">) => {
							const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
							const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0";
							return `${context.label}: ${context.parsed} ${unit} (${percentage}%)`;
						}
					}
				}
			}
		}
	};
}

function applyDistributionTheme(chart: ChartInstance<"doughnut">, theme: ChartTheme) {
	const dataset = chart.data.datasets[0];
	dataset.backgroundColor = sliceColors(theme, dataset.data.length);
	dataset.borderColor = theme.surface;
	const cfg = buildDistributionConfig([], [], "", theme);
	const options = cfg.options!;
	// Keep the unit-aware tooltip callback of the live chart.
	options.plugins = { ...options.plugins, tooltip: { ...options.plugins?.tooltip, callbacks: chart.options.plugins?.tooltip?.callbacks } };
	chart.options = options;
	chart.update("none");
}

type DistributionChartProps = {
	/** Must be referentially stable (memoized): the chart is re-created when these change. */
	names: string[];
	counts: number[];
	unit: string;
	ariaLabel: string;
};

export function DistributionChart({ names, counts, unit, ariaLabel }: DistributionChartProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const chartRef = useRef<ChartInstance<"doughnut"> | null>(null);
	const theme = useChartTheme();
	const themeRef = useRef(theme);

	useEffect(() => {
		themeRef.current = theme;
		if (chartRef.current) applyDistributionTheme(chartRef.current, theme);
	}, [theme]);

	useEffect(() => {
		let cancelled = false;
		let chart: ChartInstance<"doughnut"> | null = null;
		void loadChartModule().then(({ Chart }) => {
			const canvas = canvasRef.current;
			if (cancelled || !canvas) return;
			chart = new Chart(canvas, buildDistributionConfig(names, counts, unit, themeRef.current));
			chartRef.current = chart;
		});
		return () => {
			cancelled = true;
			chart?.destroy();
			chartRef.current = null;
		};
	}, [names, counts, unit]);

	return (
		<div className="relative h-64 w-full sm:h-72">
			<canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
		</div>
	);
}
