"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import type { PublicReferralRankingData } from "@sitcontix/types";
import { Trophy } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";

function getRankBadge(rank: number) {
	if (rank === 1) return "bg-yellow-500 text-black";
	if (rank === 2) return "bg-gray-400 text-black";
	if (rank === 3) return "bg-amber-700 text-white";
	return "bg-gray-700 text-white";
}

function getRankIcon(rank: number) {
	if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
	if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
	if (rank === 3) return <Trophy className="w-5 h-5 text-amber-700" />;
	return null;
}

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

	return (
		<>
			<main className="pt-20 pb-10 px-4 mt-32">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-4xl font-bold mb-8 flex items-center gap-3">
						<Trophy className="w-10 h-10 text-yellow-500" />
						{t.title}
					</h1>

					{/* Current User Rank Card */}
					{rankingData && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<div className="border-2 border-blue-500 dark:border-blue-400 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
								<div className="text-blue-600 dark:text-blue-400 mb-2">{t.yourRank}</div>
								<div className="text-4xl font-bold text-blue-700 dark:text-blue-300">{rankingData.currentUserRank !== null ? `#${rankingData.currentUserRank}` : t.notRanked}</div>
							</div>
							<div className="border-2 border-green-500 dark:border-green-400 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
								<div className="text-green-600 dark:text-green-400 mb-2">{t.yourReferrals}</div>
								<div className="text-4xl font-bold text-green-700 dark:text-green-300">{rankingData.currentUserReferralCount ?? 0}</div>
							</div>
							<div className="border-2 border-gray-500 dark:border-gray-600 rounded-lg p-6">
								<div className="text-gray-400 dark:text-gray-500 mb-2">{t.totalParticipants}</div>
								<div className="text-4xl font-bold">{rankingData.totalParticipants}</div>
							</div>
						</div>
					)}

					{/* Ranking List */}
					<div className="border-2 border-gray-500 dark:border-gray-600 rounded-lg p-6">
						{!rankingData?.rankings || rankingData.rankings.length === 0 ? (
							<div className="text-center text-gray-400 dark:text-gray-500 py-8">{t.noRankings}</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead>
										<tr className="border-b border-gray-700 dark:border-gray-800">
											<th className="text-left py-3 px-2 w-20">{t.rank}</th>
											<th className="text-left py-3 px-2">{t.name}</th>
											<th className="text-right py-3 px-2 w-32">{t.referralCount}</th>
										</tr>
									</thead>
									<tbody>
										{rankingData.rankings.map(item => (
											<tr
												key={item.rank}
												className={`border-b border-gray-800 dark:border-gray-900 hover:bg-gray-900 dark:hover:bg-gray-800 ${item.isCurrentUser ? "bg-blue-900/30 dark:bg-blue-800/30" : ""}`}
											>
												<td className="py-3 px-2">
													<div className="flex items-center gap-2">
														{getRankIcon(item.rank)}
														<span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadge(item.rank)}`}>{item.rank}</span>
													</div>
												</td>
												<td className="py-3 px-2">
													<span className={item.isCurrentUser ? "font-semibold text-blue-400" : ""}>
														{item.censoredName}
														{item.isCurrentUser && <span className="ml-2 text-blue-400">{t.you}</span>}
													</span>
												</td>
												<td className="text-right py-3 px-2">
													<span className="font-mono text-lg font-semibold">{item.referralCount}</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					{/* Back Button */}
					<div className="mt-8">
						<Button onClick={() => router.push(`/${eventSlug}/referral-status`)}>{t.backToStatus}</Button>
					</div>
				</div>
			</main>
		</>
	);
}
