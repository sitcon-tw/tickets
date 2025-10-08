"use client";

import React, { useEffect, useState } from 'react';
import Nav from "@/components/Nav";
import Footer from '@/components/Footer';
import { useLocale } from 'next-intl';
import { getTranslations } from "@/i18n/helpers";
import { registrationsAPI, referralsAPI } from '@/lib/api/endpoints';
import { useRouter } from '@/i18n/navigation';
import PageSpinner from '@/components/PageSpinner';
import type { RegistrationStats } from '@/lib/types/api';
import { getLocalizedText } from '@/lib/utils/localization';

export default function ReferralStatus() {
	const locale = useLocale();
	const router = useRouter();

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
	});

	const [stats, setStats] = useState<RegistrationStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const loadReferralStats = async () => {
			try {
				const registrations = await registrationsAPI.getAll();
				if (registrations.data.length === 0) {
					router.push('/');
					return;
				}
				const referralStats = await referralsAPI.getStats(registrations.data[0].id);
				setStats(referralStats.data);
			} catch (error) {
				console.error('Failed to load referral stats:', error);
				setError(true);
			} finally {
				setLoading(false);
			}
		};
		loadReferralStats();
	}, [router]);

	const getStatusText = (status: string) => {
		switch (status) {
			case 'confirmed': return t.confirmed;
			case 'pending': return t.pending;
			case 'cancelled': return t.cancelled;
			default: return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'confirmed': return 'text-green-500';
			case 'pending': return 'text-yellow-500';
			case 'cancelled': return 'text-red-500';
			default: return 'text-gray-500';
		}
	};

	if (error) {
		return (
			<>
				<Nav />
				<div className="min-h-screen flex items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold mb-4">{t.loadFailed}</h1>
						<button onClick={() => router.push('/')} className="button">
							{t.backToSuccess}
						</button>
					</div>
				</div>
				<Footer />
			</>
		);
	}

	return (
		<>
			<Nav />
			{loading ? (
				<div className="min-h-screen flex items-center justify-center">
					<PageSpinner />
				</div>
			) : (
				<main className="min-h-screen" style={{ paddingTop: '5rem', paddingBottom: '2.5rem', paddingLeft: '1rem', paddingRight: '1rem', marginTop: '8rem' }}>
					<div className="max-w-6xl mx-auto">
						<h1 className="text-4xl font-bold" style={{ marginBottom: '2rem' }}>{t.title}</h1>

						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
							<div className="border-2 border-gray-500 rounded-lg" style={{ padding: '1.5rem' }}>
								<div className="text-gray-400" style={{ marginBottom: '0.5rem' }}>{t.totalReferrals}</div>
								<div className="text-4xl font-bold">{stats?.totalReferrals || 0}</div>
							</div>
							<div className="border-2 border-gray-500 rounded-lg" style={{ padding: '1.5rem' }}>
								<div className="text-gray-400" style={{ marginBottom: '0.5rem' }}>{t.successfulReferrals}</div>
								<div className="text-4xl font-bold text-green-500">{stats?.successfulReferrals || 0}</div>
							</div>
						</div>

						{/* Referral List */}
						<div className="border-2 border-gray-500 rounded-lg" style={{ padding: '1.5rem' }}>
							<h2 className="text-2xl font-bold" style={{ marginBottom: '1rem' }}>{t.referralList}</h2>

							{!stats?.referralList || stats.referralList.length === 0 ? (
								<div className="text-center text-gray-400" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>{t.noReferrals}</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-700">
												<th className="text-left" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{t.email}</th>
												<th className="text-left" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{t.ticketName}</th>
												<th className="text-left" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{t.status}</th>
												<th className="text-left" style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{t.registeredAt}</th>
											</tr>
										</thead>
										<tbody>
											{stats.referralList.map((referral) => (
												<tr key={referral.id} className="border-b border-gray-800 hover:bg-gray-900">
													<td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{referral.email}</td>
													<td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>{getLocalizedText(referral.ticketName, locale)}</td>
													<td className={`font-semibold ${getStatusColor(referral.status)}`} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
														{getStatusText(referral.status)}
													</td>
													<td style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}>
														{new Date(referral.registeredAt).toLocaleDateString(locale)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						{/* Back Button */}
						<div style={{ marginTop: '2rem' }}>
							<button
								onClick={() => router.back()}
								className="button"
							>
								{t.backToSuccess}
							</button>
						</div>
					</div>
				</main>
			)}
			<Footer />
		</>
	);
}
