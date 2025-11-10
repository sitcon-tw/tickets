"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const SendButton = ({ onClick, disabled, isLoading, children }: { onClick: () => void; disabled: boolean; isLoading: boolean; children: React.ReactNode }) => {
	return (
		<div className="my-4 mx-auto">
			<Button onClick={onClick} disabled={disabled} size="lg" className="group relative overflow-hidden bg-primary hover:bg-primary/90 border-2 border-primary/50 dark:border-primary/30">
				<div className="svg-wrapper-1">
					<div className="svg-wrapper group-hover:animate-[fly-1_0.8s_ease-in-out_infinite_alternate]">
						{isLoading ? (
							<Spinner size="sm" />
						) : (
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								width={24}
								height={24}
								className="block origin-center transition-transform duration-300 ease-in-out group-hover:translate-x-14 group-hover:rotate-45 group-hover:scale-110"
							>
								<path fill="none" d="M0 0h24v24H0z" />
								<path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
							</svg>
						)}
					</div>
				</div>
				<span className="block ml-1.5 transition-transform duration-300 ease-in-out group-hover:translate-x-36">{children}</span>
			</Button>
		</div>
	);
};

export default function Login() {
	const locale = useLocale();
	const router = useRouter();
	const { showAlert } = useAlert();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl");
	const errorParam = searchParams.get("error");
	const [viewState, setViewState] = useState<"login" | "sent">("login");
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
			"zh-Hant": "已發送 Magic Link 至 ",
			"zh-Hans": "已发送 Magic Link 至 ",
			en: "Magic Link Sent to "
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
		},
		invalidEmail: {
			"zh-Hant": "請輸入有效的電子郵件地址",
			"zh-Hans": "请输入有效的电子邮件地址",
			en: "Please enter a valid email address"
		},
		rateLimitError: {
			"zh-Hant": "請求過於頻繁，請稍後再試",
			"zh-Hans": "请求过于频繁，请稍后再试",
			en: "Too many requests. Please try again later"
		},
		verificationFailed: {
			"zh-Hant": "驗證失敗，請重新請求登入連結",
			"zh-Hans": "验证失败，请重新请求登录链接",
			en: "Verification failed. Please request a new login link"
		},
		invalidToken: {
			"zh-Hant": "無效的連結，請重新請求登入連結",
			"zh-Hans": "无效的链接，请重新请求登录链接",
			en: "Invalid link. Please request a new login link"
		},
		serverError: {
			"zh-Hant": "伺服器錯誤，請稍後再試",
			"zh-Hans": "服务器错误，请稍后再试",
			en: "Server error. Please try again later"
		},
		emailSendError: {
			"zh-Hant": "無法發送電子郵件，請稍後再試",
			"zh-Hans": "无法发送电子邮件，请稍后再试",
			en: "Failed to send email. Please try again later"
		},
		tokenExpired: {
			"zh-Hant": "連結已過期，請重新請求登入連結",
			"zh-Hans": "链接已过期，请重新请求登录链接",
			en: "Link has expired. Please request a new login link"
		},
		acceptTermsAsLoggedIn: {
			"zh-Hant": "登入即代表您同意我們的",
			"zh-Hans": "登录即代表您同意我们的",
			en: "By logging in, you agree to our "
		},
		termsLink: {
			"zh-Hant": "服務條款與隱私政策",
			"zh-Hans": "服务条款与隐私政策",
			en: "Terms of Service and Privacy Policy"
		}
	});

	// Check if user is already logged in and redirect to home
	useEffect(() => {
		const checkAuthAndRedirect = async () => {
			try {
				const session = await authAPI.getSession();
				if (session && session.user) {
					// User is already logged in, redirect to home
					router.push(`/${locale}`);
				}
			} catch (error) {
				// User is not logged in, stay on login page
				console.log("User not logged in");
			} finally {
				setIsCheckingAuth(false);
			}
		};

		checkAuthAndRedirect();
	}, [locale, router]);

	useEffect(() => {
		if (errorParam) {
			let errorMessage = t.error;
			switch (errorParam) {
				case "verification_failed":
					errorMessage = t.verificationFailed;
					break;
				case "invalid_token":
					errorMessage = t.invalidToken;
					break;
				case "token_expired":
					errorMessage = t.tokenExpired;
					break;
				case "server_error":
					errorMessage = t.serverError;
					break;
				default:
					errorMessage = `${t.error}: ${errorParam}`;
			}
			showAlert(errorMessage, "error");
		}
	}, [errorParam, showAlert, t.error, t.invalidToken, t.serverError, t.tokenExpired, t.verificationFailed]);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const login = async () => {
		if (!email || isLoading) return;

		if (!validateEmail(email)) {
			showAlert(t.invalidEmail, "error");
			return;
		}

		setIsLoading(true);
		try {
			await authAPI.getMagicLink(email, locale, returnUrl || undefined);
			setViewState("sent");
		} catch (error) {
			console.error("Login error:", error);

			let errorMessage = t.error;
			if (error instanceof Error) {
				const errorMsg = error.message.toLowerCase();
				if (errorMsg.includes("rate limit") || errorMsg.includes("too many")) {
					errorMessage = t.rateLimitError;
				} else if (errorMsg.includes("email") || errorMsg.includes("send")) {
					errorMessage = t.emailSendError;
				} else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
					errorMessage = t.serverError;
				} else {
					errorMessage = error.message;
				}
			}

			showAlert(errorMessage, "error");
		} finally {
			setIsLoading(false);
		}
	};

	// Show loading spinner while checking auth
	if (isCheckingAuth) {
		return (
			<div className="flex flex-col items-center justify-center h-full">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center h-full">
			<h1 className="my-4 text-center text-2xl font-bold">{t.login}</h1>
			<label htmlFor="email" className="block mb-2 font-bold">
				Email
			</label>
			<Input type="email" name="email" id="email" onChange={e => setEmail(e.target.value)} className="max-w-xs" />
			<SendButton onClick={login} disabled={isLoading} isLoading={isLoading}>
				{t.continue}
			</SendButton>
			<p className="text-sm mt-20 text-gray-600 dark:text-gray-400">
				{t.acceptTermsAsLoggedIn}
				<a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">
					{t.termsLink}
				</a>
			</p>

			<div
				className={`
					w-full max-w-md transition-opacity duration-300 ease-in-out
					${viewState === "sent" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"}
				`}
			>
				<div>
					<h2 className="mb-4 text-xl font-semibold">
						{t.sent}
						{email}
					</h2>
					<p className="leading-relaxed">{t.message}</p>
				</div>
			</div>
		</div>
	);
}
