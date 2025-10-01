"use client";

import React, { useState } from 'react';
import Nav from "@/components/Nav";
import * as i18n from "@/i18n";
import { usePathname } from 'next/navigation';

export default function Login() {
	const lang = i18n.local(usePathname());
	const [viewState, setViewState] = useState<'login' | 'sent' | 'error'>('login');

	const t = i18n.t(lang, {
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
		if (!email) return;

		try {
			const BACKEND_URI = 'http://localhost:3000';
			const response = await fetch(`${BACKEND_URI}/api/auth/sign-in/magic-link`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					email: email,
					name: email.split("@")[0],
					callbackURL: window.location.origin,
					newUserCallbackURL: window.location.origin,
					errorCallbackURL: `${window.location.origin}/login/`
				})
			});

			if (response.ok) {
				setViewState('sent');
			} else {
				setViewState('error');
			}
		} catch (error) {
			console.error("Login error:", error);
			setViewState('error');
		}
	};

	return (
		<>
			<Nav />
			<main>
				<section className={viewState}>
					<div className="login-container" id="magic-link-form">
						<h1>{t.login}</h1>
						<label htmlFor="email">Email</label>
						<input type="email" name="email" id="email" />
						<button id="submit-btn" className="button" type="submit" onClick={login}>{t.continue}</button>
					</div>
					<div className="sent-container content">
						<h2>{t.sent}</h2>
						<p>{t.message}</p>
						<button className="button" onClick={() => setViewState('login')}>{t.retry}</button>
					</div>
					<div className="error-container">
						<h2>{t.error}</h2>
						<p>{t.error}</p>
					</div>
				</section>
			</main>

			<style jsx>{`
				body {
					position: relative;
				}
				h1 {
					margin-block: 1rem;
					text-align: center;
				}
				label {
					display: block;
					margin-bottom: 0.5rem;
					font-weight: bold;
				}
				input {
					border: 2px solid var(--color-gray-900);
					width: 20rem;
					padding: 0.5rem;
					max-width: 100%;
				}
				section > div {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					max-width: 100%;
					padding: 1rem;
				}

				.login-container {
					/* margin: 2rem auto;
					width: fit-content; */
				}

				section .button {
					margin: 1rem auto;
				}
				section > div {
					opacity: 0;
					pointer-events: none;
				}
				.login > .login-container,
				.sent > .sent-container,
				.error > .error-container {
					opacity: 1;
					pointer-events: all;
				}
			`}</style>
		</>
	);
}
