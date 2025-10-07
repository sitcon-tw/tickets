"use client";

import React, { useState } from 'react';
import Nav from "@/components/Nav";
import { useLocale } from 'next-intl';
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from '@/lib/api/endpoints';
import Spinner from "@/components/Spinner";

export default function Login() {
	const locale = useLocale();
	const [viewState, setViewState] = useState<'login' | 'sent' | 'error'>('login');
	const [isLoading, setIsLoading] = useState(false);

	const t = getTranslations(locale, {
		login: {
			"zh-Hant": "登入／註冊",
			"zh-Hans": "登录／注册",
			en: "Login / Register"
		},
		continue: {
			"zh-Hant": "寄送 Magic Link",
			"zh-Hans": "发送 Magic Link",
			en: "Send Magic Link"
		},
		sent: {
			"zh-Hant": "已發送 Magic Link",
			"zh-Hans": "已发送 Magic Link",
			en: "Magic Link Sent"
		},
		retry: {
			"zh-Hant": "重試",
			"zh-Hans": "重试",
			en: "Retry"
		},
		message: {
			"zh-Hant": "請檢查您的電子郵件收件匣，並點擊連結以登入。若在垃圾郵件請記得回報為非垃圾郵件，以免錯過後續重要信件。",
			"zh-Hans": "请检查您的电子邮件收件箱，并点击链接以登录。若在垃圾邮件请记得举报为非垃圾邮件，以免错过后续重要信件。",
			en: "Please check your email inbox and click the link to log in. If you find it in the spam folder, please mark it as not spam to avoid missing important future emails."
		},
		error: {
			"zh-Hant": "錯誤",
			"zh-Hans": "错误",
			en: "Error"
		}
	});

	const login = async () => {
		const emailInput = document.getElementById("email") as HTMLInputElement;
		const email = emailInput?.value;
		if (!email || isLoading) return;

		setIsLoading(true);
		try {
			await authAPI.getMagicLink(email, locale);
			setViewState('sent');
		} catch (error) {
			console.error("Login error:", error);
			setViewState('error');
		} finally {
			setIsLoading(false);
		}
	};

	const containerStyle: React.CSSProperties = {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		maxWidth: '100%',
		padding: '1rem',
		opacity: 0,
		pointerEvents: 'none'
	};

	const activeContainerStyle: React.CSSProperties = {
		...containerStyle,
		opacity: 1,
		pointerEvents: 'all'
	};

	return (
		<>
			<Nav />
			<main>
				<section>
					<div id="magic-link-form" style={viewState === 'login' ? activeContainerStyle : containerStyle}>
						<h1 style={{
							marginBlock: '1rem',
							textAlign: 'center'
						}}>{t.login}</h1>
						<label htmlFor="email" style={{
							display: 'block',
							marginBottom: '0.5rem',
							fontWeight: 'bold'
						}}>Email</label>
						<input type="email" name="email" id="email" style={{
							border: '2px solid var(--color-gray-900)',
							width: '20rem',
							padding: '0.5rem',
							maxWidth: '100%'
						}} />
						<button
							id="submit-btn"
							className="button"
							type="submit"
							onClick={login}
							disabled={isLoading}
							style={{
								margin: '1rem auto',
								opacity: isLoading ? 0.7 : 1,
								cursor: isLoading ? 'not-allowed' : 'pointer',
								transition: 'opacity 0.2s',
								alignItems: 'center',
								gap: '0.5rem'
							}}
						>
							{isLoading && <Spinner size="sm" />}
							{t.continue}
						</button>
					</div>
					<div style={viewState === 'sent' ? activeContainerStyle : containerStyle}>
						<h2>{t.sent}</h2>
						<p>{t.message}</p>
						<button
							className="button"
							onClick={() => {
								setViewState('login');
								setIsLoading(false);
							}}
							style={{
								margin: '1rem auto'
							}}
						>
							{t.retry}
						</button>
					</div>
					<div style={viewState === 'error' ? activeContainerStyle : containerStyle}>
						<h2>{t.error}</h2>
						<p>{t.error}</p>
					</div>
				</section>
			</main>
		</>
	);
}
