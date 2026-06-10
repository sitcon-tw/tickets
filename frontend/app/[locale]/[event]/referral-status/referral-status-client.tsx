"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { Link, useRouter } from "@/i18n/navigation";
import { getLocalizedText } from "@/lib/utils/localization";
import type { PublicReferralRankingData, RegistrationStats } from "@sitcontix/types";
import { Trophy } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

function getStatusColor(status: string) {
	switch (status) {
		case "confirmed":
			return "text-green-500";
		case "pending":
			return "text-yellow-500";
		case "cancelled":
			return "text-red-500";
		default:
			return "text-gray-500";
	}
}

type ReferralStatusProps = {
	initialStats: RegistrationStats | null;
	initialRankingData: PublicReferralRankingData | null;
};

export default function ReferralStatus({ initialStats, initialRankingData }: ReferralStatusProps) {
	const locale = useLocale();
	const router = useRouter();
	const params = useParams();
	const eventSlug = params.event as string;

	const stats = initialStats;
	const rankingData = initialRankingData;
	const error = !stats || !rankingData;

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "推薦狀態",
			"zh-Hans": "推荐状态",
			en: "Referral Status"
		},
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		},
		totalReferrals: {
			"zh-Hant": "總推薦數",
			"zh-Hans": "总推荐数",
			en: "Total Referrals"
		},
		successfulReferrals: {
			"zh-Hant": "成功推薦數",
			"zh-Hans": "成功推荐数",
			en: "Successful Referrals"
		},
		referralList: {
			"zh-Hant": "推薦清單",
			"zh-Hans": "推荐清单",
			en: "Referral List"
		},
		email: {
			"zh-Hant": "電子郵件",
			"zh-Hans": "电子邮件",
			en: "Email"
		},
		status: {
			"zh-Hant": "狀態",
			"zh-Hans": "状态",
			en: "Status"
		},
		ticketName: {
			"zh-Hant": "票券名稱",
			"zh-Hans": "票券名称",
			en: "Ticket Name"
		},
		registeredAt: {
			"zh-Hant": "註冊時間",
			"zh-Hans": "注册时间",
			en: "Registered At"
		},
		confirmed: {
			"zh-Hant": "已確認",
			"zh-Hans": "已确认",
			en: "Confirmed"
		},
		pending: {
			"zh-Hant": "待確認",
			"zh-Hans": "待确认",
			en: "Pending"
		},
		cancelled: {
			"zh-Hant": "已取消",
			"zh-Hans": "已取消",
			en: "Cancelled"
		},
		noReferrals: {
			"zh-Hant": "尚無推薦記錄",
			"zh-Hans": "尚无推荐记录",
			en: "No referrals yet"
		},
		backToSuccess: {
			"zh-Hant": "返回成功頁面",
			"zh-Hans": "返回成功页面",
			en: "Back to Success"
		},
		loadFailed: {
			"zh-Hant": "載入失敗",
			"zh-Hans": "载入失败",
			en: "Load failed"
		},
		yourRank: {
			"zh-Hant": "你的排名",
			"zh-Hans": "你的排名",
			en: "Your Rank"
		},
		notRanked: {
			"zh-Hant": "尚未上榜",
			"zh-Hans": "尚未上榜",
			en: "Not ranked yet"
		},
		viewLeaderboard: {
			"zh-Hant": "查看排行榜",
			"zh-Hans": "查看排行榜",
			en: "View Leaderboard"
		}
	});

	const getStatusText = (status: string) => {
		switch (status) {
			case "confirmed":
				return t.confirmed;
			case "pending":
				return t.pending;
			case "cancelled":
				return t.cancelled;
			default:
				return status;
		}
	};

	if (error) {
		return (
			<>
				<div className="flex items-center justify-center h-screen">
					<div className="text-center">
						<h1 className="text-2xl font-bold mb-4">{t.loadFailed}</h1>
						<Button onClick={() => router.push("/")}>{t.backToSuccess}</Button>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<main className="pt-20 pb-10 px-4 mt-32">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-4xl font-bold mb-8">{t.title}</h1>

					{/* Stats Cards */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<div className="border-2 border-gray-500 dark:border-gray-600 rounded-lg p-6">
							<div className="text-gray-400 dark:text-gray-500 mb-2">{t.totalReferrals}</div>
							<div className="text-4xl font-bold">{stats?.totalReferrals || 0}</div>
						</div>
						<div className="border-2 border-gray-500 dark:border-gray-600 rounded-lg p-6">
							<div className="text-gray-400 dark:text-gray-500 mb-2">{t.successfulReferrals}</div>
							<div className="text-4xl font-bold text-green-500">{stats?.successfulReferrals || 0}</div>
						</div>
						{/* Current Rank Card - Entry to Ranking Page */}
						<Link
							href={`/${eventSlug}/referral-ranking`}
							className="border-2 border-yellow-500 dark:border-yellow-400 rounded-lg p-6 bg-yellow-50 dark:bg-yellow-900/20 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
						>
							<div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
								<Trophy className="w-5 h-5" />
								<span>{t.yourRank}</span>
							</div>
							<div className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">
								{rankingData?.currentUserRank !== null && rankingData?.currentUserRank !== undefined ? `#${rankingData.currentUserRank}` : t.notRanked}
							</div>
							<div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">{t.viewLeaderboard} &rarr;</div>
						</Link>
					</div>

					{/* Referral List */}
					<div className="border-2 border-gray-500 dark:border-gray-600 rounded-lg p-6">
						<h2 className="text-2xl font-bold mb-4">{t.referralList}</h2>

						{!stats?.referralList || stats.referralList.length === 0 ? (
							<div className="text-center text-gray-400 dark:text-gray-500 py-8">{t.noReferrals}</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-700 dark:border-gray-800">
											<th className="text-left py-3 px-2">{t.email}</th>
											<th className="text-left py-3 px-2">{t.ticketName}</th>
											<th className="text-left py-3 px-2">{t.status}</th>
											<th className="text-left py-3 px-2">{t.registeredAt}</th>
										</tr>
									</thead>
									<tbody>
										{stats.referralList.map(referral => (
											<tr key={referral.id} className="border-b border-gray-800 dark:border-gray-900 hover:bg-gray-900 dark:hover:bg-gray-800">
												<td className="py-3 px-2">{referral.email}</td>
												<td className="py-3 px-2">{getLocalizedText(referral.ticketName, locale)}</td>
												<td className={`font-semibold py-3 px-2 ${getStatusColor(referral.status)}`}>{getStatusText(referral.status)}</td>
												<td className="py-3 px-2">{new Date(referral.registeredAt).toLocaleDateString(locale)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Back Button */}
					<div className="mt-8">
						<Button onClick={() => router.push(`/${eventSlug}/success`)}>{t.backToSuccess}</Button>
					</div>
				</div>
			</main>
		</>
	);
}
