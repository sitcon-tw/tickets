"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from "@/components/Nav";
import { useLocale } from 'next-intl';
import { getTranslations } from "@/i18n/helpers";
import { authAPI, registrationsAPI } from '@/lib/api/endpoints';
import Lanyard from '@/components/Lanyard';

export default function Success() {
	const locale = useLocale();

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
		participantCount: {
			"zh-Hant": "你是第",
			"zh-Hans": "你是第",
			en: "You are the "
		},
		participantSuffix: {
			"zh-Hant": "位參與者",
			"zh-Hans": "位参与者",
			en: "th participant"
		},
		inviteFriends: {
			"zh-Hant": "歡迎使用以下優惠碼 邀請朋友一起參加：",
			"zh-Hans": "欢迎使用以下优惠码 邀请朋友一起参加：",
			en: "Use the following code to invite friends:"
		},
		copyInvite: {
			"zh-Hant": "複製邀請連結",
			"zh-Hans": "复制邀请链接",
			en: "Copy invite link"
		},
		reward: {
			"zh-Hant": "邀請三位朋友可以獲得◯◯◯",
			"zh-Hans": "邀请三位朋友可以获得◯◯◯",
			en: "Invite three friends to earn ◯◯◯"
		},
		edit: {
			"zh-Hant": "編輯報名資訊",
			"zh-Hans": "编辑报名信息",
			en: "Edit registration info"
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
		copied: {
			"zh-Hant": "已複製!",
			"zh-Hans": "已复制!",
			en: "Copied!"
		},
		copyFailed: {
			"zh-Hant": "複製失敗，請手動複製: ",
			"zh-Hans": "复制失败，请手动复制: ",
			en: "Copy failed, please copy manually: "
		}
	});

	const [participantCount, setParticipantCount] = useState<number | string>(t.loading);
	const [referralCode, setReferralCode] = useState<string>(t.loading);
	const [copyText, setCopyText] = useState<string>('');

	useEffect(() => {
		const loadSuccessInfo = async () => {
			try {
				// Check if user is authenticated
				await authAPI.getSession();

				// Get user's registrations to show count
				let count: number | string = t.loadFailed;
				try {
					const registrations = await registrationsAPI.getAll();
					if (registrations.success && registrations.data) {
						count = registrations.data.length || 1;
					}
				} catch (error) {
					console.error('Failed to load registrations:', error);
				}
				setParticipantCount(count);

				// Get referral code - Note: This endpoint needs to be implemented in the API
				const code = t.loadFailed;
				setReferralCode(code);

			} catch (error) {
				console.error('Failed to load success info:', error);
				window.location.href = '/login/';
			}
		};
		setCopyText(t.copyInvite);
		loadSuccessInfo();
	}, [t.copyInvite, t.loadFailed]);

	const handleCopy = () => {
		const baseUrl = window.location.origin;
		const inviteUrl = `${baseUrl}/?ref=${referralCode}`;

		navigator.clipboard.writeText(inviteUrl).then(() => {
			const originalText = copyText;
			setCopyText(t.copied);
			setTimeout(() => {
				setCopyText(originalText);
			}, 2000);
		}).catch(err => {
			console.error('Failed to copy: ', err);
			alert(t.copyFailed + inviteUrl);
		});
	};

	return (
		<>
			<Nav />
			<div className="grid grid-cols-1 sm:grid-cols-[50%_50%] md:grid-cols-[40%_60%] min-h-screen max-w-full overflow-hidden">
				<section className="pt-20 flex flex-col justify-center items-end">
					<div className="flex flex-col gap-4">
						<h1 className="my-4 text-5xl">{t.success}</h1>
						<p>{t.emailCheck}</p>
						<p>{t.participantCount} <span id="participant-count" className="text-2xl">{participantCount}</span> {t.participantSuffix}<br />{t.inviteFriends}</p>
						<div id="referral-code" className="border border-gray-900 p-3 px-6 overflow-y-auto w-full max-w-60">
							{referralCode}
						</div>
						<div id="copy" onClick={handleCopy} className="underline cursor-pointer mb-6">
							{copyText}
						</div>
						<p>{t.reward}</p>
						<Link href="/form/" className="button w-fit">{t.edit}</Link>
					</div>
				</section>
				<div className="relative overflow-hidden hidden sm:block">
					<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
				</div>
			</div>
		</>
	);
}
