"use client";

import Spinner from "@/components/Spinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { useState } from "react";

const SendButton = ({ onClick, disabled, isLoading, children }: { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode }) => {
	return (
		<div style={{
			opacity: disabled ? 0.7 : 1
		}}>
			<button 
				onClick={onClick} 
				disabled={disabled}
				style={{
					fontFamily: 'inherit',
					fontSize: '18px',
					background: 'var(--color-gray-800)',
					color: 'white',
					padding: '0.6em 1em',
					display: 'flex',
					alignItems: 'center',
					border: 'var(--color-gray-600) 2px solid',
					borderRadius: '8px',
					overflow: 'hidden',
					transition: 'all 0.2s',
					cursor: disabled ? 'not-allowed' : 'pointer',
					margin: '1rem auto'
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<div>
						{isLoading ? (
							<Spinner size="sm" />
						) : (
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24}>
								<path fill="none" d="M0 0h24v24H0z" />
								<path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
							</svg>
						)}
					</div>
				</div>
				<span style={{
					display: 'block',
					marginLeft: '0.3em',
					transition: 'all 0.3s ease-in-out'
				}}>
					{children}
				</span>
			</button>
		</div>
	);
};

export default function Login() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl");
	const [viewState, setViewState] = useState<"login" | "sent">("login");
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
			await authAPI.getMagicLink(email, locale, returnUrl || undefined);
			setViewState("sent");
		} catch (error) {
			console.error("Login error:", error);
			showAlert(t.error + ": " + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<main>
				<section style={{ position: 'relative', height: '100vh' }}>
					<div style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						maxWidth: '100%',
						padding: '1rem',
						opacity: viewState === "login" ? 1 : 0,
						pointerEvents: viewState === "login" ? "all" : "none",
						transition: 'opacity 0.3s ease-in-out'
					}}>
						<h1 style={{
							marginBlock: '1rem',
							textAlign: 'center'
						}}>
							{t.login}
						</h1>
						<label 
							htmlFor="email"
							style={{
								display: 'block',
								marginBottom: '0.5rem',
								fontWeight: 'bold'
							}}
						>
							Email
						</label>
						<input 
							type="email" 
							name="email" 
							id="email"
							style={{
								border: '2px solid var(--color-gray-900)',
								width: '20rem',
								padding: '0.5rem',
								maxWidth: '100%',
								borderRadius: '8px'
							}}
						/>
						<SendButton onClick={login} disabled={isLoading} isLoading={isLoading}>
							{t.continue}
						</SendButton>
					</div>

					<div style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						maxWidth: '100%',
						padding: '1rem',
						opacity: viewState === "sent" ? 1 : 0,
						pointerEvents: viewState === "sent" ? "all" : "none",
						transition: 'opacity 0.3s ease-in-out'
					}}>
						<div>
							<h2 style={{ marginBottom: '1rem' }}>{t.sent}</h2>
							<p style={{ lineHeight: 1.6 }}>{t.message}</p>
						</div>
					</div>
				</section>
			</main>
		</>
	);
}
