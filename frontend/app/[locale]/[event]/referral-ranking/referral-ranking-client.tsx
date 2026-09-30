"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { Link, useRouter } from "@/i18n/navigation";
import type { PublicReferralRankingData } from "@sitcontix/types";
import { ArrowLeft, Crown, Trophy, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

const PODIUM_STYLES = [
	{ ring: "border-yellow-500", icon: "text-yellow-500", badge: "bg-yellow-500 text-black", pad: "md:pt-8 md:pb-8" },
	{ ring: "border-gray-400", icon: "text-gray-400", badge: "bg-gray-400 text-black", pad: "" },
	{ ring: "border-amber-700", icon: "text-amber-700", badge: "bg-amber-700 text-white", pad: "" }
];

type ReferralRankingProps = {
	initialRankingData: PublicReferralRankingData | null;
};

export default function ReferralRanking({ initialRankingData }: ReferralRankingProps) {
	const locale = useLocale();
	const router = useRouter();
	const params = useParams();
	const eventSlug = params.event as string;

	const rankingData = initialRankingData;
	const error = !rankingData;

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "推薦排行榜",
			"zh-Hans": "推荐排行榜",
			en: "Referral Leaderboard"
		},
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		},
		rank: {
			"zh-Hant": "名次",
			"zh-Hans": "名次",
			en: "Rank"
		},
		name: {
			"zh-Hant": "名稱",
			"zh-Hans": "名称",
			en: "Name"
		},
		referralCount: {
			"zh-Hant": "推薦數",
			"zh-Hans": "推荐数",
			en: "Referrals"
		},
		yourRank: {
			"zh-Hant": "你的排名",
			"zh-Hans": "你的排名",
			en: "Your Rank"
		},
		yourReferrals: {
			"zh-Hant": "你的推薦數",
			"zh-Hans": "你的推荐数",
			en: "Your Referrals"
		},
		notRanked: {
			"zh-Hant": "尚未上榜",
			"zh-Hans": "尚未上榜",
			en: "Not ranked yet"
		},
		noRankings: {
			"zh-Hant": "目前尚無排行資料",
			"zh-Hans": "目前尚无排行资料",
			en: "No rankings yet"
		},
		totalParticipants: {
			"zh-Hant": "總參與人數",
			"zh-Hans": "总参与人数",
			en: "Total Participants"
		},
		backToStatus: {
			"zh-Hant": "返回推薦狀態",
			"zh-Hans": "返回推荐状态",
			en: "Back to Referral Status"
		},
		loadFailed: {
			"zh-Hant": "載入失敗",
			"zh-Hans": "载入失败",
			en: "Load failed"
		},
		you: {
			"zh-Hant": "（你）",
			"zh-Hans": "（你）",
			en: "(You)"
		}
	});

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">{t.loadFailed}</h1>
					<Button onClick={() => router.push(`/${eventSlug}/referral-status`)}>{t.backToStatus}</Button>
				</div>
			</div>
		);
	}

	const rankings = rankingData.rankings;
	const podium = rankings.slice(0, 3);
	// On wide screens the winner sits in the middle (2nd, 1st, 3rd); on mobile it stays in rank order
	const podiumOrderClass = podium.length === 3 ? ["md:order-2", "md:order-1", "md:order-3"] : ["", "", ""];
	const rest = rankings.slice(3);
	const rank = rankingData.currentUserRank;

	return (
		<main className="mx-auto mt-32 w-full max-w-4xl px-4 pt-20 pb-16">
			<Link
				href={`/${eventSlug}/referral-status`}
				className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
			>
				<ArrowLeft size={16} />
				{t.backToStatus}
			</Link>
			<h1 className="mb-8 flex items-center gap-3 text-3xl font-bold md:text-4xl">
				<Trophy className="size-8 text-yellow-500 md:size-9" />
				{t.title}
			</h1>

			{/* Personal summary ticket */}
			<div className="ticket ticket-static mb-10 w-full">
				<div className="ticket-body">
					<div className="ticket-main grid grid-cols-2 gap-6 p-6!">
						<div>
							<div className="mb-1 text-sm text-gray-500 dark:text-gray-400">{t.yourReferrals}</div>
							<div className="text-4xl font-bold text-green-600 tabular-nums dark:text-green-400">{rankingData.currentUserReferralCount ?? 0}</div>
						</div>
						<div>
							<div className="mb-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
								<Users size={14} />
								{t.totalParticipants}
							</div>
							<div className="text-4xl font-bold tabular-nums">{rankingData.totalParticipants}</div>
						</div>
					</div>
					<div className="ticket-stub text-yellow-700 dark:text-yellow-400">
						<Trophy size={28} strokeWidth={1.5} />
						<span className="text-xs">{t.yourRank}</span>
						<span className="text-xl leading-tight font-bold">{rank !== null ? `#${rank}` : "—"}</span>
						{rank === null && <span className="text-xs">{t.notRanked}</span>}
					</div>
				</div>
			</div>

			{rankings.length === 0 ? (
				<div className="rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
					<Trophy className="mx-auto mb-3 opacity-50" size={32} strokeWidth={1.5} />
					{t.noRankings}
				</div>
			) : (
				<>
					{/* Podium */}
					<div className="mb-6 grid grid-cols-1 items-end gap-4 md:grid-cols-3">
						{podium.map((item, i) => {
							const style = PODIUM_STYLES[i];
							return (
								<div
									key={`${item.rank}-${i}`}
									className={`relative flex flex-col items-center rounded-lg border-2 bg-white px-4 py-5 text-center dark:bg-gray-800 ${style.ring} ${style.pad} ${podiumOrderClass[i]} ${item.isCurrentUser ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900" : ""}`}
								>
									{i === 0 ? <Crown className={`mb-2 size-7 ${style.icon}`} /> : <Trophy className={`mb-2 size-6 ${style.icon}`} />}
									<span className={`mb-3 inline-flex size-9 items-center justify-center rounded-full text-base font-bold ${style.badge}`}>{item.rank}</span>
									<div className="max-w-full truncate font-semibold">
										{item.censoredName}
										{item.isCurrentUser && <span className="ml-1 text-blue-500 dark:text-blue-400">{t.you}</span>}
									</div>
									<div className="mt-1 text-3xl font-bold tabular-nums">{item.referralCount}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{t.referralCount}</div>
								</div>
							);
						})}
					</div>

					{/* Remaining ranks */}
					{rest.length > 0 && (
						<ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border-2 border-gray-200 dark:divide-gray-700 dark:border-gray-700">
							{rest.map((item, i) => (
								<li
									key={`${item.rank}-${i}`}
									className={`flex items-center gap-4 px-4 py-3 transition-colors ${item.isCurrentUser ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/60"}`}
								>
									<span className="w-8 shrink-0 text-center font-semibold text-gray-500 tabular-nums dark:text-gray-400">{item.rank}</span>
									<span className={`min-w-0 flex-1 truncate ${item.isCurrentUser ? "font-semibold text-blue-600 dark:text-blue-400" : ""}`}>
										{item.censoredName}
										{item.isCurrentUser && <span className="ml-2">{t.you}</span>}
									</span>
									<span className="font-mono text-lg font-semibold tabular-nums">{item.referralCount}</span>
								</li>
							))}
						</ul>
					)}
				</>
			)}
		</main>
	);
}
