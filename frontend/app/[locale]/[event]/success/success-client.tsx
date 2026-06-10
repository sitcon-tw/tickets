"use client";

import Lanyard from "@/components/Lanyard";
import QRCodePopup from "@/components/QRCodePopup";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, referralsAPI, registrationsAPI } from "@/lib/api/endpoints";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { ArrowLeft, Check, CheckCheck, Copy } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useState } from "react";

type SuccessRegistrationState = {
	referralCode: string;
	registrationId: string | null;
	registerationTicketName: string | null;
	registrationTime: Date | null;
	isCancelled: boolean;
	useOpass: boolean;
	opassEventId: string | null;
	isMissingRegistration: boolean;
};

type SuccessRegistrationAction =
	| { type: "eventLoaded"; useOpass: boolean; opassEventId: string | null }
	| {
			type: "registrationLoaded";
			registrationId: string;
			registrationTime: Date;
			registerationTicketName: string;
			isCancelled: boolean;
			referralCode: string;
	  }
	| { type: "referralLoaded"; referralCode: string }
	| { type: "missingRegistration" }
	| { type: "failed" };

function successRegistrationReducer(state: SuccessRegistrationState, action: SuccessRegistrationAction): SuccessRegistrationState {
	switch (action.type) {
		case "eventLoaded":
			return { ...state, useOpass: action.useOpass, opassEventId: action.opassEventId };
		case "registrationLoaded":
			return {
				...state,
				registrationId: action.registrationId,
				registrationTime: action.registrationTime,
				registerationTicketName: action.registerationTicketName,
				isCancelled: action.isCancelled,
				referralCode: action.referralCode,
				isMissingRegistration: false
			};
		case "referralLoaded":
			return { ...state, referralCode: action.referralCode };
		case "missingRegistration":
			return { ...state, referralCode: "Failed", isMissingRegistration: true };
		case "failed":
			return { ...state, referralCode: "Failed" };
		default:
			return state;
	}
}

type QrPopupState = {
	showQRCode: boolean;
	qrValue: string;
};

type QrPopupAction = { type: "opened"; qrValue: string } | { type: "closed" };

function qrPopupReducer(state: QrPopupState, action: QrPopupAction): QrPopupState {
	switch (action.type) {
		case "opened":
			return { showQRCode: true, qrValue: action.qrValue };
		case "closed":
			return { ...state, showQRCode: false };
		default:
			return state;
	}
}

type NavigationLoadingState = {
	viewRefLoading: boolean;
	viewRegLoading: boolean;
};

type NavigationLoadingAction = { type: "viewReferral" } | { type: "viewRegistration" };

function navigationLoadingReducer(state: NavigationLoadingState, action: NavigationLoadingAction): NavigationLoadingState {
	switch (action.type) {
		case "viewReferral":
			return { ...state, viewRefLoading: true };
		case "viewRegistration":
			return { ...state, viewRegLoading: true };
		default:
			return state;
	}
}

type SuccessTranslations = Record<string, string>;

function MissingRegistrationView({ eventSlug, t }: { eventSlug: string; t: SuccessTranslations }) {
	return (
		<main className="h-screen flex flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-4xl font-bold text-center text-foreground">{t.loadFailed}</h1>
			<Button asChild variant="secondary">
				<Link href={`/${eventSlug}`}>
					<ArrowLeft size={24} />
					{eventSlug}
				</Link>
			</Button>
		</main>
	);
}

function ReferralCodeCopyButton({ referralCode, t, copiedCode, onCopy }: { referralCode: string; t: SuccessTranslations; copiedCode: boolean; onCopy: () => void }) {
	return (
		<button
			type="button"
			onClick={onCopy}
			className="cursor-pointer border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-1 px-2 text-left"
		>
			{referralCode === "Loading..." ? (
				<Spinner />
			) : (
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm sm:text-lg">{referralCode}</span>
					{referralCode !== t.loadFailed && (
						<span className="cursor-pointer" title={t.copyInvite}>
							{copiedCode ? <Check className="text-green-500" /> : <Copy />}
						</span>
					)}
				</div>
			)}
		</button>
	);
}

function ReferralUrlCopyButton({
	referralCode,
	t,
	copiedUrl,
	eventSlug,
	locale,
	isScreenReallySmall,
	onCopy
}: {
	referralCode: string;
	t: SuccessTranslations;
	copiedUrl: boolean;
	eventSlug: string;
	locale: string;
	isScreenReallySmall: boolean;
	onCopy: () => void;
}) {
	const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`;
	const displayUrl = isScreenReallySmall ? `${referralUrl.substring(0, 10)}...` : referralUrl.length > 20 && !locale.includes("zh") ? `${referralUrl.substring(0, 20)}...` : referralUrl;

	return (
		<button
			type="button"
			onClick={onCopy}
			className="cursor-pointer border-2 border-gray-400 dark:border-gray-500 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-1 px-2 text-left"
		>
			{referralCode === "Loading..." ? (
				<Spinner />
			) : referralCode === "Failed" ? (
				<span className="font-mono text-lg">{`${t.loadFailed}`}</span>
			) : (
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm sm:text-lg" title={referralUrl}>
						{displayUrl}
					</span>
					{referralCode !== "Failed" && (
						<span className="cursor-pointer" title={t.copyInvite}>
							{copiedUrl ? <Check className="text-green-500" /> : <Copy />}
						</span>
					)}
				</div>
			)}
		</button>
	);
}

function SuccessContent() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const autoCheckin = searchParams.has("checkin");
	const eventSlug = params.event as string;

	const [{ referralCode, registrationId, registerationTicketName, registrationTime, isCancelled, useOpass, opassEventId, isMissingRegistration }, dispatchRegistration] = useReducer(
		successRegistrationReducer,
		{
			referralCode: "Loading...",
			registrationId: null,
			registerationTicketName: null,
			registrationTime: null,
			isCancelled: false,
			useOpass: true,
			opassEventId: null,
			isMissingRegistration: false
		}
	);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const [{ viewRefLoading, viewRegLoading }, dispatchNavigationLoading] = useReducer(navigationLoadingReducer, {
		viewRefLoading: false,
		viewRegLoading: false
	});
	const [{ showQRCode, qrValue }, dispatchQrPopup] = useReducer(qrPopupReducer, { showQRCode: false, qrValue: "" });
	const [isScreenReallySmall, setIsScreenReallySmall] = useState(() => typeof window !== "undefined" && window.innerWidth < 315);

	const t = getTranslations(locale, {
		success: {
			"zh-Hant": "報名成功！",
			"zh-Hans": "报名成功！",
			en: "You're In!"
		},
		cancelled: {
			"zh-Hant": "報名已取消",
			"zh-Hans": "报名已取消",
			en: "Registration Cancelled"
		},
		emailCheck: {
			"zh-Hant": "請多留意電子信箱",
			"zh-Hans": "请多留意电子信箱",
			en: "Please check your email inbox"
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
		qrDesc: {
			"zh-Hant": "如何報到？",
			"zh-Hans": "如何报到？",
			en: "How to check in?"
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
		viewReferralStatus: {
			"zh-Hant": "查看推薦狀態",
			"zh-Hans": "查看推荐状态",
			en: "View Referral Status"
		},
		viewMyRegistration: {
			"zh-Hant": "查看/編輯報名",
			"zh-Hans": "查看/编辑报名",
			en: "View/Edit Registration"
		},
		viewQRCode: {
			"zh-Hant": "查看報到方式",
			"zh-Hans": "查看报到方式",
			en: "View Check-in Info"
		}
	});

	async function openQRCode(regId: string | null, regTime: Date | null) {
		if (!regId || !regTime) return;
		dispatchQrPopup({ type: "opened", qrValue: await generateHash(regId, regTime) });
	}

	function handleCopyRefCode() {
		setCopiedCode(false);
		if (referralCode === t.loading || referralCode === t.loadFailed) return;
		navigator.clipboard
			.writeText(referralCode)
			.then(() => {
				setCopiedCode(true);
			})
			.catch(() => {
				showAlert(t.copyFailed + referralCode, "error");
			});
		setTimeout(() => setCopiedCode(false), 2000);
	}

	function handleCopyRefUrl() {
		setCopiedUrl(false);
		if (referralCode === t.loading || referralCode === t.loadFailed) return;
		const url = `${window.location.origin}/${locale}/${eventSlug}?ref=${referralCode}`;
		navigator.clipboard
			.writeText(url)
			.then(() => {
				setCopiedUrl(true);
			})
			.catch(() => {
				showAlert(t.copyFailed + url, "error");
			});
		setTimeout(() => setCopiedUrl(false), 2000);
	}

	useEffect(() => {
		const loadSuccessInfo = async () => {
			try {
				try {
					const eventsData = await eventsAPI.getAll();
					const foundEvent = eventsData.data.find(e => e.slug === eventSlug || e.id.slice(-6) === eventSlug);

					if (!foundEvent) {
						dispatchRegistration({ type: "failed" });
						return;
					}

					const currentEventId = foundEvent.id;
					dispatchRegistration({ type: "eventLoaded", useOpass: foundEvent.useOpass ?? true, opassEventId: foundEvent.opassEventId ?? null });

					const registrations = await registrationsAPI.getAll();
					const eventRegistration = registrations.data.find(reg => reg.event?.id === currentEventId);
					if (eventRegistration) {
						let ticketname = getLocalizedText(eventRegistration.ticket?.name, locale) || "Ticket";
						ticketname = ticketname
							.replace(/\(.*?\)/g, "")
							.replace(/（.*?）/g, "")
							.trim();
						if (eventRegistration.status === "cancelled") {
							dispatchRegistration({
								type: "registrationLoaded",
								registrationId: eventRegistration.id,
								registrationTime: eventRegistration.createdAt,
								registerationTicketName: ticketname,
								isCancelled: true,
								referralCode: "Failed"
							});
						} else {
							dispatchRegistration({
								type: "registrationLoaded",
								registrationId: eventRegistration.id,
								registrationTime: eventRegistration.createdAt,
								registerationTicketName: ticketname,
								isCancelled: false,
								referralCode: "Loading..."
							});
							if (autoCheckin) {
								await openQRCode(eventRegistration.id, eventRegistration.createdAt);
							}
							const code = (await referralsAPI.getReferralLink(eventRegistration.id)).data.referralCode;
							dispatchRegistration({ type: "referralLoaded", referralCode: code });
						}
					} else {
						dispatchRegistration({ type: "missingRegistration" });
					}
				} catch (error) {
					console.error("Failed to load registrations:", error);
					dispatchRegistration({ type: "failed" });
				}
			} catch (error) {
				console.error("Failed to load success info:", error);
				const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
				window.location.href = `/login/?returnUrl=${returnUrl}`;
			}
		};
		loadSuccessInfo();
	}, [autoCheckin, eventSlug, locale, t.loadFailed]);

	useEffect(() => {
		const handleResize = () => {
			setIsScreenReallySmall(window.innerWidth < 315);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return (
		<>
			{isMissingRegistration ? (
				<MissingRegistrationView eventSlug={eventSlug} t={t} />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] md:grid-cols-[50%_50%] max-w-full overflow-hidden">
					<section className="pt-20 flex flex-col justify-center sm:items-end items-center">
						<div className="flex flex-col gap-4">
							<h1 className="my-4 text-5xl font-bold">{isCancelled ? t.cancelled : t.success}</h1>
							{!isCancelled && <p>{t.emailCheck}</p>}
							{!isCancelled && (
								<>
									<p>{t.inviteFriends}</p>
									<ReferralCodeCopyButton referralCode={referralCode} t={t} copiedCode={copiedCode} onCopy={handleCopyRefCode} />
									<p>{t.copyInviteLink}</p>
									<ReferralUrlCopyButton
										referralCode={referralCode}
										t={t}
										copiedUrl={copiedUrl}
										eventSlug={eventSlug}
										locale={locale}
										isScreenReallySmall={isScreenReallySmall}
										onCopy={handleCopyRefUrl}
									/>
									<h3 className="text-xl font-semibold mt-2">{t.qrDesc}</h3>
									{registrationId && registrationTime && (
										<Button onClick={() => void openQRCode(registrationId, registrationTime)} className="flex items-center gap-2 mb-2">
											<CheckCheck size={24} /> {t.viewQRCode}
										</Button>
									)}
								</>
							)}
							<div className="border-t-2 border-gray-700" />
							<div className={`gap-4 mt-2 flex ${locale.includes("en") && "flex-col"}`}>
								{registrationId && (
									<Button
										className="px-3"
										isLoading={viewRegLoading}
										onClick={() => {
											dispatchNavigationLoading({ type: "viewRegistration" });
											router.push(`/my-registration/${registrationId}`);
										}}
									>
										{t.viewMyRegistration}
									</Button>
								)}
								{!isCancelled && (
									<Button
										className="px-3"
										isLoading={viewRefLoading}
										onClick={() => {
											dispatchNavigationLoading({ type: "viewReferral" });
											router.push(`${window.location.href.replace(/\/success$/, "")}/referral-status`);
										}}
									>
										{t.viewReferralStatus}
									</Button>
								)}
							</div>
							<Button className="w-fit" onClick={() => router.push(`${window.location.href.replace(/\/success$/, "")}`)}>
								<ArrowLeft size={24} />
							</Button>
						</div>
					</section>
					<div className="relative overflow-hidden hidden sm:block h-screen">
						<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} name={registerationTicketName || undefined} />
					</div>
				</div>
			)}
			{registrationId && registrationTime && <QRCodePopup isOpen={showQRCode} onClose={() => dispatchQrPopup({ type: "closed" })} qrValue={qrValue} useOpass={useOpass} opassEventId={opassEventId} />}
		</>
	);
}

export default function Success() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-screen">
					<Spinner />
				</div>
			}
		>
			<SuccessContent />
		</Suspense>
	);
}
