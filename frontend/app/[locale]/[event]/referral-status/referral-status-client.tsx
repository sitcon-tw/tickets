"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { Link, useRouter } from "@/i18n/navigation";
import { getLocalizedText } from "@/lib/utils/localization";
import type { PublicReferralRankingData, RegistrationStats } from "@sitcontix/types";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Ticket, Trophy, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

function getStatusClass(status: string) {
	switch (status) {
		case "confirmed":
			return "active";
		case "pending":
			return "pending";
		case "cancelled":
			return "ended";
		default:
			return "";
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

	const total = stats?.totalReferrals ?? 0;
	const successful = stats?.successfulReferrals ?? 0;
	const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;
	const rank = rankingData?.currentUserRank;
	const referralList = stats?.referralList ?? [];

	return (
		<main className="mx-auto mt-32 w-full max-w-4xl px-4 pt-20 pb-16">
			<Link href={`/${eventSlug}/success`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
				<ArrowLeft size={16} />
				{t.backToSuccess}
			</Link>
			<h1 className="mb-8 text-3xl font-bold md:text-4xl">{t.title}</h1>

			{/* Summary ticket: stats on the left, leaderboard entry as the tear-off stub */}
			<div className="ticket ticket-static mb-10 w-full">
				<div className="ticket-body">
					<div className="ticket-main p-6!">
						<div className="grid grid-cols-2 gap-6">
							<div>
								<div className="mb-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
									<Users size={14} />
									{t.totalReferrals}
								</div>
								<div className="text-4xl font-bold tabular-nums">{total}</div>
							</div>
							<div>
								<div className="mb-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
									<BadgeCheck size={14} />
									{t.successfulReferrals}
								</div>
								<div className="text-4xl font-bold text-green-600 tabular-nums dark:text-green-400">{successful}</div>
							</div>
						</div>
						<div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-valuenow={successRate} aria-valuemin={0} aria-valuemax={100}>
							<div className="h-full rounded-full bg-green-500 transition-all duration-500" style={{ width: `${successRate}%` }} />
						</div>
					</div>
					<Link
						href={`/${eventSlug}/referral-ranking`}
						aria-label={t.viewLeaderboard}
						className="ticket-stub text-yellow-700 transition-colors hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
					>
						<Trophy size={28} strokeWidth={1.5} />
						<span className="text-xs">{t.yourRank}</span>
						<span className="text-xl leading-tight font-bold">{rank !== null && rank !== undefined ? `#${rank}` : "—"}</span>
						{(rank === null || rank === undefined) && <span className="text-xs">{t.notRanked}</span>}
						<span className="mt-1 flex items-center gap-0.5 text-xs font-medium">
							{t.viewLeaderboard}
							<ArrowRight size={12} />
						</span>
					</Link>
				</div>
			</div>

			{/* Referral list */}
			<section>
				<h2 className="mb-4 text-xl font-bold">
					{t.referralList}
					<span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">({referralList.length})</span>
				</h2>

				{referralList.length === 0 ? (
					<div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
						<Users className="mx-auto mb-3 opacity-50" size={32} strokeWidth={1.5} />
						{t.noReferrals}
					</div>
				) : (
					<ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border-2 border-gray-200 dark:divide-gray-700 dark:border-gray-700">
						{referralList.map(referral => (
							<li key={referral.id} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
								<div
									className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-600 uppercase dark:bg-gray-700 dark:text-gray-300"
									aria-hidden
								>
									{referral.email.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate font-medium">{referral.email}</div>
									<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-gray-500 dark:text-gray-400">
										<span className="inline-flex items-center gap-1">
											<Ticket size={13} />
											{getLocalizedText(referral.ticketName, locale)}
										</span>
										<span className="inline-flex items-center gap-1">
											<CalendarDays size={13} />
											{new Date(referral.registeredAt).toLocaleDateString(locale)}
										</span>
									</div>
								</div>
								<span className={`status-badge shrink-0 ${getStatusClass(referral.status)}`}>{getStatusText(referral.status)}</span>
							</li>
						))}
					</ul>
				)}
			</section>
		</main>
	);
}
