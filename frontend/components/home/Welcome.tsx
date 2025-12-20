"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, smsVerificationAPI } from "@/lib/api/endpoints";
import { WelcomeProps } from "@/lib/types/components";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

type WelcomeState = "notloggedin" | "registered" | "referral" | "default" | "cancelled";

export default function Welcome({ eventId, eventSlug }: WelcomeProps) {
	const locale = useLocale();
	const router = useRouter();

	const [welcomeState, setWelcomeState] = useState<WelcomeState>("notloggedin");
	const [referralParam, setReferralParam] = useState<string | null>(null);
	const [isSmsVerified, setIsSmsVerified] = useState(false);
	const [loading, setLoading] = useState(false);

	const t = getTranslations(locale, {
		loginToRegister: {
			"zh-Hant": "登入後即可報名！",
			"zh-Hans": "登录后即可报名！",
			en: "Login to register!"
		},
		login: {
			"zh-Hant": "立刻登入",
			"zh-Hans": "立刻登录",
			en: "Login now"
		},
		loggedInWelcome: {
			"zh-Hant": "歡迎回來！趕緊開始報名吧！",
			"zh-Hans": "欢迎回来！赶紧开始报名吧！",
			en: "Welcome back! Let's get you registered!"
		},
		loggedInWelcomeDescription: {
			"zh-Hant": "選擇下方的票種開始報名。",
			"zh-Hans": "选择下方的票种开始报名。",
			en: "Choose a ticket type below to get started."
		},
		haveNotVerifySMS1: {
			"zh-Hant": "您還沒有完成簡訊驗證！",
			"zh-Hans": "您还没有完成短信验证！",
			en: "You haven't completed SMS verification!"
		},
		haveNotVerifySMS2: {
			"zh-Hant": "某些票券可能需要驗證手機號碼才能報名。前往驗證：",
			"zh-Hans": "某些票券可能需要验证手机号码才能报名。前往验证：",
			en: "Some tickets may require a verified phone number to register. Verify now:"
		},
		verifyNow: {
			"zh-Hant": "驗證手機",
			"zh-Hans": "验证手机",
			en: "Verify now"
		},
		registeredWelcome: {
			"zh-Hant": "你已完成報名！",
			"zh-Hans": "你已完成报名！",
			en: "Registration Complete!"
		},
		cancelledWelcome: {
			"zh-Hant": "你的報名已取消",
			"zh-Hans": "你的报名已取消",
			en: "Your Registration Has Been Cancelled"
		},
		viewRegDetail: {
			"zh-Hant": "查看報名資料",
			"zh-Hans": "查看报名资料",
			en: "View Registration Details"
		},
		viewCancelledReg: {
			"zh-Hant": "查看已取消的報名",
			"zh-Hans": "查看已取消的报名",
			en: "View Cancelled Registration"
		},
		referralWelcome: {
			"zh-Hant": "邀請你一起參加 SITCON！",
			"zh-Hans": "邀请你一起参加 SITCON！",
			en: "invites you to join SITCON!"
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
		promotionalText: {
			"zh-Hant": "選擇下方您的票種開始報名吧！",
			"zh-Hans": "选择下方您的票种开始报名吧！",
			en: "Choose your ticket type below to get started!"
		},
		friend: {
			"zh-Hant": "朋友",
			"zh-Hans": "朋友",
			en: "Friend"
		}
	});

	useEffect(() => {
		if (typeof window === "undefined") return;

		const referral = localStorage.getItem("referralCode");
		setReferralParam(referral);

		let cancelled = false;

		async function handleWelcome() {
			try {
				const sessionData = await authAPI.getSession();

				if (!sessionData) {
					decideState(false);
					return;
				}

				try {
					const registrations = await registrationsAPI.getAll();
					if (registrations?.success && Array.isArray(registrations.data) && registrations.data.length > 0) {
						const eventRegistration = registrations.data.find(reg => reg.event?.id === eventId);
						if (eventRegistration && !cancelled) {
							if (eventRegistration.status === "cancelled") {
								setWelcomeState("cancelled");
							} else {
								setWelcomeState("registered");
							}
							return;
						}
					}

					const smsData = await smsVerificationAPI.getStatus();
					if (smsData?.success && smsData.data.phoneVerified) {
						setIsSmsVerified(true);
					} else {
						setIsSmsVerified(false);
					}
				} catch (error) {
					console.error("Failed to load registrations", error);
				}

				decideState(true);
			} catch (error) {
				console.error("Failed to handle welcome section", error);
				decideState(false);
			}
		}

		function decideState(isAuthenticated: boolean) {
			if (cancelled) return;
			if (referralParam) {
				setWelcomeState("referral");
				return;
			}
			setWelcomeState(isAuthenticated ? "default" : "notloggedin");
		}

		handleWelcome();

		return () => {
			cancelled = true;
		};
	}, [referralParam, eventId, t.loadFailed]);

	return (
		<section className="pb-4">
			{welcomeState === "registered" && (
				<section className={`text-center animate-[fadeInUp_0.5s_ease-out]`}>
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">{t.registeredWelcome}</h2>
					<div className="items-center justify-center flex">
						<Button
							isLoading={loading}
							onClick={() => {
								setLoading(true);
								router.push(`/${eventSlug}/success`);
							}}
						>
							{t.viewRegDetail}
						</Button>
					</div>
				</section>
			)}

			{welcomeState === "cancelled" && (
				<section className={`text-center animate-[fadeInUp_0.5s_ease-out]`}>
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">{t.cancelledWelcome}</h2>
					<div className="items-center justify-center flex">
						<Button
							isLoading={loading}
							onClick={() => {
								setLoading(true);
								router.push(`/${eventSlug}/success`);
							}}
						>
							{t.viewCancelledReg}
						</Button>
					</div>
				</section>
			)}

			{welcomeState === "referral" && (
				<>
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">
						<span>{referralParam || t.friend}</span> {t.referralWelcome}
					</h2>
					<p className="text-gray-800 dark:text-gray-200">{t.promotionalText}</p>
				</>
			)}

			{welcomeState === "default" && (
				<>
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100 text-center">{t.loggedInWelcome}</h2>
					{isSmsVerified ? (
						<p className="text-gray-800 dark:text-gray-200 text-center mt-4">{t.loggedInWelcomeDescription}</p>
					) : (
						<>
							<div className="text-yellow-500 text-center mt-4">
								<p>{t.haveNotVerifySMS1}</p>
								<p>{t.haveNotVerifySMS2}</p>
								<Button
									className="text-gray-900 dark:text-gray-100 mt-3"
									onClick={() => {
										router.push(`/verify`);
									}}
								>
									{t.verifyNow}
								</Button>
							</div>
						</>
					)}
				</>
			)}

			{welcomeState === "notloggedin" && (
				<>
					<h2 className="text-2xl mb-4 text-gray-900 dark:text-gray-100 text-center">{t.loginToRegister}</h2>
					<div className="items-center justify-center flex">
						<Button
							onClick={() => {
								router.push(`/login`);
							}}
						>
							{t.login}
						</Button>
					</div>
				</>
			)}
		</section>
	);
}
