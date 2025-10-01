"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
import { analytics, initializeAdminPage } from "@/lib/admin";
import { Chart, registerables, ChartConfiguration } from 'chart.js';

// Register Chart.js components
if (typeof window !== 'undefined') {
  Chart.register(...registerables);
}

type DashboardData = {
  totalTickets?: number;
  soldTickets?: number;
  remainingTickets?: number;
  totalRegistrations?: number;
  confirmedRegistrations?: number;
  pendingRegistrations?: number;
  ticketSales?: Record<string, any>;
};

export default function AdminDashboard() {
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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

  const t = i18n.t(lang, {
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
      const isAuthorized = await initializeAdminPage();
      if (!isAuthorized) return;

      const response = await analytics.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        console.error('Failed to load dashboard data:', response.message);
      }
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize charts
  const initCharts = useCallback(() => {
    // Clear existing charts
    chartsInstancesRef.current.forEach(chart => chart.destroy());
    chartsInstancesRef.current = [];

    const ticketTypes = [t.student, t.regular, t.distant, t.invite, t.opensource];
    const colors = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"];

    // Line Chart - Ticket Sales Trends
    if (trendsChartRef.current) {
      const ctx = trendsChartRef.current.getContext("2d");
      if (ctx) {
        const chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月"],
            datasets: [
              {
                label: t.student,
                data: [150, 145, 140, 135, 130, 128, 126, 124],
                borderColor: colors[0],
                backgroundColor: colors[0] + "20",
                tension: 0.4
              },
              {
                label: t.regular,
                data: [200, 190, 180, 170, 160, 155, 148, 143],
                borderColor: colors[1],
                backgroundColor: colors[1] + "20",
                tension: 0.4
              },
              {
                label: t.distant,
                data: [80, 75, 70, 65, 58, 52, 48, 45],
                borderColor: colors[2],
                backgroundColor: colors[2] + "20",
                tension: 0.4
              },
              {
                label: t.invite,
                data: [50, 48, 45, 40, 35, 32, 28, 25],
                borderColor: colors[3],
                backgroundColor: colors[3] + "20",
                tension: 0.4
              },
              {
                label: t.opensource,
                data: [20, 18, 16, 15, 13, 12, 11, 10],
                borderColor: colors[4],
                backgroundColor: colors[4] + "20",
                tension: 0.4
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
                title: { display: true, text: "剩餘票券數量", color: "#f3f4f6" },
                ticks: { color: "#d1d5db" },
                grid: { color: "#4b5563" }
              },
              x: {
                title: { display: true, text: "月份", color: "#f3f4f6" },
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
    if (distributionChartRef.current) {
      const ctx = distributionChartRef.current.getContext("2d");
      if (ctx) {
        const chart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ticketTypes,
            datasets: [{
              label: "剩餘票券",
              data: [26, 57, 35, 25, 10],
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: "#fff"
            }]
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
                  label: function (context: any) {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                    return context.label + ": " + context.parsed + " 張 (" + percentage + "%)";
                  }
                }
              }
            }
          }
        });
        chartsInstancesRef.current.push(chart);
      }
    }

    // Progress Charts (Half Doughnut)
    const ticketData = [
      { ref: studentChartRef, soldCount: 124, total: 150, color: "#FF6384" },
      { ref: regularChartRef, soldCount: 143, total: 200, color: "#36A2EB" },
      { ref: distantChartRef, soldCount: 45, total: 80, color: "#FFCE56" },
      { ref: inviteChartRef, soldCount: 25, total: 50, color: "#4BC0C0" },
      { ref: opensourceChartRef, soldCount: 10, total: 20, color: "#9966FF" }
    ];

    ticketData.forEach(ticket => {
      if (ticket.ref.current) {
        const ctx = ticket.ref.current.getContext("2d");
        if (ctx) {
          const percentage = ((ticket.soldCount / ticket.total) * 100).toFixed(1);
          const remaining = ticket.total - ticket.soldCount;

          const chart = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["已售出", "剩餘"],
              datasets: [{
                data: [ticket.soldCount, remaining],
                backgroundColor: [ticket.color, "#E5E5E5"],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
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
                    label: function (context: any) {
                      return context.label + ": " + context.parsed + " 張";
                    }
                  }
                }
              }
            },
            plugins: [{
              id: 'centerText',
              afterDraw: function (chart: any) {
                const ctx = chart.ctx;
                const width = chart.width;
                const height = chart.height;

                ctx.restore();
                const fontSize = (height / 100).toFixed(2);
                ctx.font = `bold ${fontSize}em sans-serif`;
                ctx.textBaseline = "middle";
                ctx.fillStyle = ticket.color;

                const text = percentage + "%";
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 1.4;

                ctx.fillText(text, textX, textY);
                ctx.save();
              }
            }]
          });
          chartsInstancesRef.current.push(chart);
        }
      }
    });
  }, [t]);

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

  const totalTickets = dashboardData?.totalTickets || 500;
  const soldTickets = dashboardData?.soldTickets || 347;
  const remainingTickets = dashboardData?.remainingTickets || 153;
  const salesRate = totalTickets > 0 ? ((soldTickets / totalTickets) * 100).toFixed(1) : '0';

  return (
    <>
      <AdminNav />
      <main className="dashboard">
        <h1>{t.overview}</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{t.totalTickets}</h3>
            <div className="stat-number">{totalTickets}</div>
            <div className="stat-label">{t.tickets}</div>
          </div>
          <div className="stat-card">
            <h3>{t.sold}</h3>
            <div className="stat-number">{soldTickets}</div>
            <div className="stat-label">{t.tickets}</div>
          </div>
          <div className="stat-card">
            <h3>{t.remaining}</h3>
            <div className="stat-number">{remainingTickets}</div>
            <div className="stat-label">{t.tickets}</div>
          </div>
          <div className="stat-card">
            <h3>{t.salesRate}</h3>
            <div className="stat-number">{salesRate}%</div>
            <div className="stat-label">{t.completion}</div>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-container trend">
            <h2>{t.salesTrend}</h2>
            <canvas ref={trendsChartRef} width="100%" height="50px"></canvas>
          </div>

          <div className="chart-container">
            <h2>{t.ticketDistribution}</h2>
            <canvas ref={distributionChartRef} width="100%" height="100%"></canvas>
          </div>
        </div>

        <div className="progress-section">
          <h2>{t.progressTitle}</h2>
          <div className="progress-grid">
            {[
              { title: t.student, ref: studentChartRef, remaining: 26, total: 150, sold: 124 },
              { title: t.regular, ref: regularChartRef, remaining: 57, total: 200, sold: 143 },
              { title: t.distant, ref: distantChartRef, remaining: 35, total: 80, sold: 45 },
              { title: t.invite, ref: inviteChartRef, remaining: 25, total: 50, sold: 25 },
              { title: t.opensource, ref: opensourceChartRef, remaining: 10, total: 20, sold: 10 }
            ].map((ticket, idx) => (
              <div key={idx} className="progress-card">
                <h3>{ticket.title}</h3>
                <div className="progress-chart-wrapper">
                  <canvas ref={ticket.ref} width="200" height="100"></canvas>
                </div>
                <div className="remaining-display">
                  <div className="remaining-number">{ticket.remaining}</div>
                  <div className="remaining-label">{t.remainingLabel}</div>
                </div>
                <div className="progress-details">
                  <div className="detail-item">
                    <span>{t.total}</span>
                    <span>{ticket.total}</span>
                  </div>
                  <div className="detail-item">
                    <span>{t.soldLabel}</span>
                    <span>{ticket.sold}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: var(--color-gray-800);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 1rem 0;
          color: var(--color-gray-300);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--color-gray-100);
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: var(--color-gray-100);
          font-size: 0.8rem;
        }

        .charts-section {
          display: flex;
          gap: 2rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .chart-container {
          background: var(--color-gray-800);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          flex: 1;
          max-width: 100%;
        }

        .trend {
          flex: 2;
        }

        .chart-container h2 {
          margin: 0 0 1rem 0;
          color: var(--color-gray-100);
          font-size: 1.2rem;
        }

        .progress-section {
          background: var(--color-gray-800);
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .progress-section h2 {
          margin: 0 0 1.5rem 0;
          color: var(--color-gray-100);
          font-size: 1.2rem;
        }

        .progress-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .progress-card {
          background: var(--color-gray-700);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 100%;
        }

        .progress-card h3 {
          margin: 0 0 1.5rem 0;
          color: var(--color-gray-200);
          font-size: 1.1rem;
          font-weight: 600;
        }

        .progress-chart-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .remaining-display {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: var(--color-gray-600);
          border-radius: 8px;
        }

        .remaining-number {
          font-size: 2.5rem;
          font-weight: bold;
          color: var(--color-gray-100);
          line-height: 1;
        }

        .remaining-label {
          font-size: 0.9rem;
          color: var(--color-gray-300);
          margin-top: 0.25rem;
        }

        .progress-details {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .detail-item span:first-child {
          color: var(--color-gray-300);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .detail-item span:last-child {
          font-weight: 600;
          color: var(--color-gray-200);
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .charts-section {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .progress-grid {
            grid-template-columns: 1fr;
          }

          .progress-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .detail-item {
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}
