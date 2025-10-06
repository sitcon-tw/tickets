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
			<main style={{
				display: 'grid',
				gridTemplateColumns: '1fr 1fr',
				minHeight: '100vh',
				gap: '2rem'
			}}>
				<section style={{
					paddingTop: '5rem',
					paddingLeft: '2rem',
					paddingRight: '2rem',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					gap: '1rem'
				}}>
					<h1 style={{
						marginBlock: '1rem',
						fontSize: '3rem'
					}}>{t.success}</h1>
					<p>{t.emailCheck}</p>
					<p>{t.participantCount} <span id="participant-count" style={{ fontSize: '2em' }}>{participantCount}</span> {t.participantSuffix}<br />{t.inviteFriends}</p>
					<div id="referral-code" style={{
						border: '1px solid var(--color-gray-900)',
						padding: '0.8rem 1.5rem',
						overflowY: 'auto',
						width: '100%',
						maxWidth: '15rem'
					}}>{referralCode}</div>
					<div id="copy" onClick={handleCopy} style={{
						textDecoration: 'underline',
						cursor: 'pointer',
						marginBottom: '1.5rem'
					}}>{copyText}</div>
					<p>{t.reward}</p>
					<Link href="/form/" className="button" style={{ width: 'fit-content' }}>{t.edit}</Link>
				</section>
				<div style={{
					position: 'relative',
					overflow: 'hidden'
				}}>
					<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} />
				</div>
			</main>
		</>
	);
}
