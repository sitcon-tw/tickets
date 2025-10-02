"use client";

import React, { useEffect, useState } from 'react';
import Nav from "@/components/Nav";
import * as i18n from "@/i18n";
import { usePathname } from 'next/navigation';

export default function Success() {
	const lang = i18n.local(usePathname());
	const [participantCount, setParticipantCount] = useState<number | string>('載入中...');
	const [referralCode, setReferralCode] = useState<string>('載入中...');
	const [copyText, setCopyText] = useState<string>('');

	const t = i18n.t(lang, {
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
		}
	});

	useEffect(() => {
		setCopyText(t.copyInvite);
		loadSuccessInfo();
	}, []);

	const loadSuccessInfo = async () => {
		try {
			// Check if user is authenticated
			const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
				credentials: 'include'
			});

			if (!sessionResponse.ok) {
				window.location.href = '/login/';
				return;
			}

			// Get user's registrations to show count
			const registrationsResponse = await fetch('http://localhost:3000/api/registrations', {
				credentials: 'include'
			});

			let count: number | string = "載入失敗";
			if (registrationsResponse.ok) {
				const registrations = await registrationsResponse.json();
				if (registrations.success && registrations.data) {
					count = registrations.data.length || 1;
				}
			}
			setParticipantCount(count);

			// Get referral code
			let code = "載入失敗";
			const referralResponse = await fetch('http://localhost:3000/api/referrals', {
				credentials: 'include'
			});

			if (referralResponse.ok) {
				const referral = await referralResponse.json();
				if (referral.success && referral.data) {
					code = referral.data.code;
				}
			} else if (referralResponse.status === 404) {
				// Create referral code if it doesn't exist
				const createResponse = await fetch('http://localhost:3000/api/referrals', {
					method: 'POST',
					credentials: 'include'
				});

				if (createResponse.ok) {
					const created = await createResponse.json();
					if (created.success && created.data) {
						code = created.data.code;
					}
				}
			}
			setReferralCode(code);

		} catch (error) {
			console.error('Failed to load success info:', error);
		}
	};

	const handleCopy = () => {
		const baseUrl = window.location.origin;
		const inviteUrl = `${baseUrl}/?ref=${referralCode}`;

		navigator.clipboard.writeText(inviteUrl).then(() => {
			const originalText = copyText;
			setCopyText('已複製!');
			setTimeout(() => {
				setCopyText(originalText);
			}, 2000);
		}).catch(err => {
			console.error('Failed to copy: ', err);
			alert('複製失敗，請手動複製: ' + inviteUrl);
		});
	};

	return (
		<>
			<Nav />
			<main>
				<section style={{
					paddingTop: '5rem',
					display: 'flex',
					flexDirection: 'column',
					maxHeight: 'calc(100vh - 4rem)',
					gap: '1rem',
					textAlign: 'center'
				}}>
					<h1 style={{
						marginBlock: '1rem',
						fontSize: '3rem',
						textAlign: 'center'
					}}>{t.success}</h1>
					<p>{t.emailCheck}</p>
					<p>{t.participantCount} <span id="participant-count" style={{ fontSize: '2em' }}>{participantCount}</span> {t.participantSuffix}<br />{t.inviteFriends}</p>
					<div id="referral-code" style={{
						border: '1px solid var(--color-gray-900)',
						padding: '0.8rem 1.5rem',
						height: '0',
						overflowY: 'auto',
						flex: '1',
						width: '100%',
						maxWidth: '10rem',
						margin: 'auto'
					}}>{referralCode}</div>
					<div id="copy" onClick={handleCopy} style={{
						textDecoration: 'underline',
						cursor: 'pointer',
						marginBottom: '1.5rem'
					}}>{copyText}</div>
					<p>{t.reward}</p>
					<a href="/form/" className="button" style={{ margin: 'auto' }}>{t.edit}</a>
				</section>
			</main>
		</>
	);
}
