"use client";

import type { EventDashboardData } from "@sitcontix/types";
import type { RefObject } from "react";

type AdminDashboardContentProps = {
	dashboardData: EventDashboardData;
	locale: string;
	t: Record<string, string>;
	trendsChartRef: RefObject<HTMLCanvasElement | null>;
	distributionChartRef: RefObject<HTMLCanvasElement | null>;
};

export function AdminDashboardContent({ dashboardData, locale, t, trendsChartRef, distributionChartRef }: AdminDashboardContentProps) {
	return (
		<>
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
	);
}
