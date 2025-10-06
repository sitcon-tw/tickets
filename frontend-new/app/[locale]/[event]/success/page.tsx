"use client";

import React, { useEffect, useState } from 'react';
import Nav from "@/components/Nav";
import Footer from '@/components/Footer';
import { useLocale } from 'next-intl';
import { getTranslations } from "@/i18n/helpers";
import { registrationsAPI, referralsAPI } from '@/lib/api/endpoints';
import { Copy, Check } from 'lucide-react';
import Spinner from '@/components/Spinner';
import Lanyard from '@/components/Lanyard';
import { useRouter } from '@/i18n/navigation';

export default function Success() {
	const locale = useLocale();
	const router = useRouter();

	const t = getTranslations(locale, {
		success: {
			"zh-Hant": "報名成功！",
			"zh-Hans": "报名成功！",
			en: "Registration Successful!"
		},
		emailCheck: {
			"zh-Hant": "請檢查電子郵件確認",
			"zh-Hans": "请检查电子邮件确认",
			en: "Please check your email for confirmation."
		},
		inviteFriends: {
			"zh-Hant": "歡迎使用以下推薦碼 邀請朋友一起參加：",
			"zh-Hans": "欢迎使用以下推荐码 邀请朋友一起参加：",
			en: "Use the following code to invite friends:"
		},
		copyInviteLink: {
			"zh-Hant": "或複製推薦連結：",
			"zh-Hans": "或复制推荐链接：",
			en: "Or copy referral link:"
		},
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		},
		loadFailed: {
			"zh-Hant": "載入失敗",
			"zh-Hans": "载入失败",
			en: "Load failed"
		},
		goBackHome: {
			"zh-Hant": "回到首頁",
			"zh-Hans": "回到首页",
			en: "Go back home"
		},
	});

	const [referralCode, setReferralCode] = useState<string>(t.loading);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);

	useEffect(() => {
		const loadSuccessInfo = async () => {
			try {
				try {
					const registrations = await registrationsAPI.getAll();
				const code = (await referralsAPI.getReferralLink(registrations.data[0].id)).data.referralCode;
				setReferralCode(code);
				} catch (error) {
					console.error('Failed to load registrations:', error);
				}

			} catch (error) {
				console.error('Failed to load success info:', error);
				window.location.href = '/login/';
			}
		};
		loadSuccessInfo();
	}, [t.copyInvite, t.loadFailed]);

	function handleCopyRefCode() {
		setCopiedCode(false);
		if (referralCode === t.loading || referralCode === t.loadFailed) return;
		navigator.clipboard.writeText(referralCode).then(() => {
			setCopiedCode(true);
		}).catch(() => {
			alert(t.copyFailed + referralCode);
		});
		setTimeout(() => setCopiedCode(false), 2000);
	};

	function handleCopyRefUrl() {
		setCopiedUrl(false);
		if (referralCode === t.loading || referralCode === t.loadFailed) return;
		const url = `${window.location.origin}/?ref=${referralCode}`;
		navigator.clipboard.writeText(url).then(() => {
			setCopiedUrl(true);
		}).catch(() => {
			alert(t.copyFailed + url);
		});
		setTimeout(() => setCopiedUrl(false), 2000);
	};

	return (
		<>
			<Nav />
			<div className="grid grid-cols-1 sm:grid-cols-[50%_50%] md:grid-cols-[40%_60%] min-h-screen max-w-full overflow-hidden">
				<section className="pt-20 flex flex-col justify-center sm:items-end items-center">
					<div className="flex flex-col gap-4">
						<h1 className="my-4 text-5xl font-bold">{t.success}</h1>
						<p>{t.emailCheck}</p>
						<p>{t.inviteFriends}</p>
						<div onClick={handleCopyRefCode} className="cursor-pointer border-2 border-gray-500 hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-4" style={{ padding: '0.1rem 0.5rem' }}>
							{referralCode === t.loading ? (
								<Spinner />
							) : (
								<div className="flex items-center gap-2">
									<span className="font-mono text-lg">{referralCode}</span>
									{referralCode !== t.loadFailed && (
										<span className="cursor-pointer" title={t.copyInvite}>
											{copiedCode ? <Check className="text-green-500" /> : <Copy />}
										</span>
									)}
								</div>
							)}
						</div>
						<p>{t.copyInviteLink}</p>
						<div onClick={handleCopyRefUrl} className="cursor-pointer border-2 border-gray-500 hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-4" style={{ padding: '0.1rem 0.5rem' }}>
							{referralCode === t.loading ? (
								<Spinner />
							) : (
								<div className="flex items-center gap-2">
									<span className="font-mono text-lg">{`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${referralCode}`}</span>
									{referralCode !== t.loadFailed && (
										<span className="cursor-pointer" title={t.copyInvite}>
											{copiedUrl ? <Check className="text-green-500" /> : <Copy />}
										</span>
									)}
								</div>
							)}
						</div>
						<button onClick={() => router.push(`${window.location.href.replace(/\/success$/, '')}`)} className="button" style={{ marginTop: '1rem' }}>{t.goBackHome}</button>
					</div>
				</section>
				<div className="relative overflow-hidden hidden sm:block">
					<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
				</div>
			</div>
			<Footer />
		</>
	);
}
