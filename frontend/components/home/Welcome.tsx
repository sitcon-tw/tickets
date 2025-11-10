"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, smsVerificationAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import ElectricBorder from "../ElectricBorder";

type WelcomeState = "hidden" | "registered" | "referral" | "default";

interface WelcomeProps {
	eventId: string;
	eventSlug: string;
}

export default function Welcome({ eventId, eventSlug }: WelcomeProps) {
	const locale = useLocale();
	const router = useRouter();

	const [welcomeState, setWelcomeState] = useState<WelcomeState>("hidden");
	const [referralParam, setReferralParam] = useState<string | null>(null);
	const [isSmsVerified, setIsSmsVerified] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isSafari, setIsSafari] = useState(false);

	const t = getTranslations(locale, {
		loggedInWelcome: {
			"zh-Hant": "歡迎回來！趕緊開始報名吧！",
			"zh-Hans": "欢迎回来！赶紧开始报名吧！",
			en: "Welcome back! Let's get you registered!"
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
		viewRegDetail: {
			"zh-Hant": "查看報名資料",
			"zh-Hans": "查看报名资料",
			en: "View Registration Details"
		},
		referralWelcome: {
			"zh-Hant": "邀請你一起參加 SITCON！",
			"zh-Hans": "邀请你一起参加 SITCON！",
			en: "invites you to join SITCON!"
		},
		selectTicket: {
			"zh-Hant": "請選擇你要的票種",
			"zh-Hans": "请选择你要的票种",
			en: "Please select your ticket type"
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
			"zh-Hant": "最後一個註冊的是 gay",
			"zh-Hans": "最後一個註冊的是 gay",
			en: "The last one who registered is gay!"
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

		const ua = navigator.userAgent;
		const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(ua);
		setIsSafari(isSafariBrowser);

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
						const hasRegisteredForEvent = registrations.data.some(reg => reg.event?.id === eventId);
						if (hasRegisteredForEvent && !cancelled) {
							setWelcomeState("registered");
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
			setWelcomeState(isAuthenticated ? "default" : "hidden");
		}

		handleWelcome();

		return () => {
			cancelled = true;
		};
	}, [referralParam, eventId, t.loadFailed]);

	const registeredContent = (
		<section className={`p-8 m-4 text-center animate-[fadeInUp_0.5s_ease-out] bg-gray-100 dark:bg-gray-800 ${isSafari ? "border-[5px] border-[#5A738F]" : ""}`}>
			<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">{t.registeredWelcome}</h2>
			<div className="items-center justify-center flex">
				<Button
					onClick={() => {
						setLoading(true);
						router.push(`/${eventSlug}/success`);
					}}
				>
					{loading ? (
						<>
							<Spinner size="sm" />{" "}
						</>
					) : null}
					{t.viewRegDetail}
				</Button>
			</div>
		</section>
	);

	return (
		<section>
			{welcomeState === "registered" ? (
				isSafari ? (
					registeredContent
				) : (
					<ElectricBorder color="#5A738F" chaos={0.7} thickness={5}>
						{registeredContent}
					</ElectricBorder>
				)
			) : null}

			{welcomeState === "referral" ? (
				<section className="bg-gray-100 dark:bg-gray-800 p-8 m-4 text-center animate-[fadeInUp_0.5s_ease-out]">
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">
						<span>{referralParam || t.friend}</span> {t.referralWelcome}
					</h2>
					<p className="text-gray-800 dark:text-gray-200">{t.promotionalText}</p>
				</section>
			) : null}

			{welcomeState === "default" ? (
				<section className="bg-gray-100 dark:bg-gray-800 p-8 m-4 text-center animate-[fadeInUp_0.5s_ease-out]">
					<h2 className="text-2xl mb-2 text-gray-900 dark:text-gray-100">{t.loggedInWelcome}</h2>
					{!isSmsVerified && (
						<div className="text-yellow-200 items-center justify-center flex flex-col gap-2">
							<div>
								<p>{t.haveNotVerifySMS1}</p>
								<p>{t.haveNotVerifySMS2}</p>
							</div>
							<Button
								className="text-white"
								onClick={() => {
									router.push(`/verify`);
								}}
							>
								{t.verifyNow}
							</Button>
						</div>
					)}
				</section>
			) : null}

			<h2 className="text-base my-8 text-center font-normal animate-[blink_1s_infinite_linear_alternate] opacity-80 text-gray-900 dark:text-gray-100">{t.selectTicket}</h2>
		</section>
	);
}
