"use client";

import Lanyard from "@/components/Lanyard";
import QRCodePopup from "@/components/QRCodePopup";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { Link, useRouter } from "@/i18n/navigation";
import { eventsAPI, referralsAPI, registrationsAPI } from "@/lib/api/endpoints";
import generateHash from "@/lib/utils/hash";
import { getLocalizedText } from "@/lib/utils/localization";
import { ArrowLeft, Check, CheckCheck, Copy } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useRef, useState } from "react";
import { findEventRegistration } from "../registration-utils";

type PageStatus = "loading" | "loaded" | "pending" | "notRegistered" | "eventNotFound" | "error";

type ReferralState = { status: "loading" } | { status: "ready"; code: string } | { status: "failed" };

type SuccessRegistrationState = {
	pageStatus: PageStatus;
	referral: ReferralState;
	registrationId: string | null;
	registerationTicketName: string | null;
	registrationTime: Date | null;
	isCancelled: boolean;
	checkedIn: boolean;
	useOpass: boolean;
	opassEventId: string | null;
};

type SuccessRegistrationAction =
	| { type: "eventLoaded"; useOpass: boolean; opassEventId: string | null }
	| {
			type: "registrationLoaded";
			registrationId: string;
			registrationTime: Date;
			registerationTicketName: string;
			isCancelled: boolean;
			checkedIn: boolean;
	  }
	| { type: "referralLoaded"; referralCode: string }
	| { type: "referralFailed" }
	| { type: "pendingRegistration" }
	| { type: "missingRegistration" }
	| { type: "eventNotFound" }
	| { type: "failed" };

function successRegistrationReducer(state: SuccessRegistrationState, action: SuccessRegistrationAction): SuccessRegistrationState {
	switch (action.type) {
		case "eventLoaded":
			return { ...state, useOpass: action.useOpass, opassEventId: action.opassEventId };
		case "registrationLoaded":
			return {
				...state,
				pageStatus: "loaded",
				registrationId: action.registrationId,
				registrationTime: action.registrationTime,
				registerationTicketName: action.registerationTicketName,
				isCancelled: action.isCancelled,
				checkedIn: action.checkedIn,
				referral: action.isCancelled ? { status: "failed" } : { status: "loading" }
			};
		case "referralLoaded":
			return { ...state, referral: { status: "ready", code: action.referralCode } };
		case "referralFailed":
			return { ...state, referral: { status: "failed" } };
		case "pendingRegistration":
			return { ...state, pageStatus: "pending" };
		case "missingRegistration":
			return { ...state, pageStatus: "notRegistered" };
		case "eventNotFound":
			return { ...state, pageStatus: "eventNotFound" };
		case "failed":
			return { ...state, pageStatus: "error" };
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

function StatusView({ title, description, backHref, backLabel }: { title: string; description?: string; backHref: string; backLabel: string }) {
	return (
		<main className="h-screen flex flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-4xl font-bold text-center text-foreground">{title}</h1>
			{description && <p className="max-w-md text-center text-muted-foreground">{description}</p>}
			<Button asChild variant="secondary">
				<Link href={backHref}>
					<ArrowLeft size={24} />
					{backLabel}
				</Link>
			</Button>
		</main>
	);
}

function ReferralCodeCopyButton({ referral, t, copiedCode, onCopy }: { referral: ReferralState; t: SuccessTranslations; copiedCode: boolean; onCopy: () => void }) {
	return (
		<button
			type="button"
			onClick={onCopy}
			disabled={referral.status !== "ready"}
			className="cursor-pointer disabled:cursor-default border-2 border-gray-400 dark:border-gray-500 enabled:hover:bg-gray-300 dark:enabled:hover:bg-gray-700 transition-all duration-200 rounded-md w-fit max-w-full p-1 px-2 text-left"
		>
			{referral.status === "loading" ? (
				<Spinner />
			) : referral.status === "failed" ? (
				<span className="font-mono text-lg">{t.loadFailed}</span>
			) : (
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm sm:text-lg break-all">{referral.code}</span>
					<span className="cursor-pointer shrink-0" title={t.copyInvite}>
						{copiedCode ? <Check className="text-green-500" /> : <Copy />}
					</span>
				</div>
			)}
		</button>
	);
}

function ReferralUrlCopyButton({
	referral,
	t,
	copiedUrl,
	eventSlug,
	locale,
	isScreenReallySmall,
	onCopy
}: {
	referral: ReferralState;
	t: SuccessTranslations;
	copiedUrl: boolean;
	eventSlug: string;
	locale: string;
	isScreenReallySmall: boolean;
	onCopy: () => void;
}) {
	const referralCode = referral.status === "ready" ? referral.code : "";
	const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`;
	const displayUrl = isScreenReallySmall ? `${referralUrl.substring(0, 10)}...` : referralUrl.length > 20 && !locale.includes("zh") ? `${referralUrl.substring(0, 20)}...` : referralUrl;

	return (
		<button
			type="button"
			onClick={onCopy}
			disabled={referral.status !== "ready"}
			className="cursor-pointer disabled:cursor-default border-2 border-gray-400 dark:border-gray-500 enabled:hover:bg-gray-300 dark:enabled:hover:bg-gray-700 transition-all duration-200 rounded-md w-fit max-w-full p-1 px-2 text-left"
		>
			{referral.status === "loading" ? (
				<Spinner />
			) : referral.status === "failed" ? (
				<span className="font-mono text-lg">{t.loadFailed}</span>
			) : (
				<div className="flex items-center gap-2 min-w-0">
					<span className="font-mono text-sm sm:text-lg break-all min-w-0" title={referralUrl}>
						{displayUrl}
					</span>
					<span className="cursor-pointer shrink-0" title={t.copyInvite}>
						{copiedUrl ? <Check className="text-green-500" /> : <Copy />}
					</span>
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

	const [{ pageStatus, referral, registrationId, registerationTicketName, registrationTime, isCancelled, checkedIn, useOpass, opassEventId }, dispatchRegistration] = useReducer(
		successRegistrationReducer,
		{
			pageStatus: "loading",
			referral: { status: "loading" },
			registrationId: null,
			registerationTicketName: null,
			registrationTime: null,
			isCancelled: false,
			checkedIn: false,
			useOpass: true,
			opassEventId: null
		}
	);
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const [{ viewRefLoading, viewRegLoading }, dispatchNavigationLoading] = useReducer(navigationLoadingReducer, {
		viewRefLoading: false,
		viewRegLoading: false
	});
	const [{ showQRCode, qrValue }, dispatchQrPopup] = useReducer(qrPopupReducer, { showQRCode: false, qrValue: "" });
	const lanyardAnchorRef = useRef<HTMLDivElement>(null);
	const [isScreenReallySmall, setIsScreenReallySmall] = useState(false);

	const t = getTranslations(locale, {
		success: {
			"zh-Hant": "報名成功！",
			en: "You're In!"
		},
		cancelled: {
			"zh-Hant": "報名已取消",
			en: "Registration Cancelled"
		},
		cancelledDesc: {
			"zh-Hant": "你的這筆報名已取消。如需參加，請回到活動頁面重新報名。",
			en: "This registration has been cancelled. To attend, go back to the event page and register again."
		},
		pendingTitle: {
			"zh-Hant": "報名尚未完成",
			en: "Registration Not Complete"
		},
		pendingDesc: {
			"zh-Hant": "你的座位目前僅暫時保留，報名尚未完成。請回到活動頁面選擇票種並送出報名表單。",
			en: "Your seat is only temporarily held and your registration isn't finished yet. Go back to the event page, select a ticket and submit the registration form."
		},
		notRegisteredTitle: {
			"zh-Hant": "你尚未報名此活動",
			en: "You haven't registered for this event"
		},
		eventNotFound: {
			"zh-Hant": "找不到此活動",
			en: "Event not found"
		},
		backToEvent: {
			"zh-Hant": "返回活動頁面",
			en: "Back to event"
		},
		backToHome: {
			"zh-Hant": "返回首頁",
			en: "Back to home"
		},
		emailCheck: {
			"zh-Hant": "請多留意電子信箱",
			en: "Please check your email inbox"
		},
		inviteFriends: {
			"zh-Hant": "歡迎使用以下推薦碼 邀請朋友一起參加：",
			en: "Use the following code to invite friends:"
		},
		copyInviteLink: {
			"zh-Hant": "或複製推薦連結：",
			en: "Or copy referral link:"
		},
		copyInvite: {
			"zh-Hant": "點擊複製",
			en: "Click to copy"
		},
		copyFailed: {
			"zh-Hant": "複製失敗，請手動複製：",
			en: "Copy failed, please copy it manually: "
		},
		qrDesc: {
			"zh-Hant": "如何報到？",
			en: "How to check in?"
		},
		loadFailed: {
			"zh-Hant": "載入失敗",
			en: "Load failed"
		},
		viewReferralStatus: {
			"zh-Hant": "查看推薦狀態",
			en: "View Referral Status"
		},
		viewMyRegistration: {
			"zh-Hant": "查看/編輯報名",
			en: "View/Edit Registration"
		},
		checkedIn: {
			"zh-Hant": "已報到",
			en: "Checked in"
		},
		viewQRCode: {
			"zh-Hant": "查看報到方式",
			en: "View Check-in Info"
		}
	});

	async function openQRCode(regId: string | null, regTime: Date | null) {
		if (!regId || !regTime) return;
		dispatchQrPopup({ type: "opened", qrValue: await generateHash(regId, regTime) });
	}

	function handleCopyRefCode() {
		setCopiedCode(false);
		if (referral.status !== "ready") return;
		const code = referral.code;
		navigator.clipboard
			.writeText(code)
			.then(() => {
				setCopiedCode(true);
			})
			.catch(() => {
				showAlert(t.copyFailed + code, "error");
			});
		setTimeout(() => setCopiedCode(false), 2000);
	}

	function handleCopyRefUrl() {
		setCopiedUrl(false);
		if (referral.status !== "ready") return;
		const url = `${window.location.origin}/${locale}/${eventSlug}?ref=${referral.code}`;
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
			let eventRegistration;
			try {
				const foundEvent = await eventsAPI.findBySlug(eventSlug);

				if (!foundEvent) {
					dispatchRegistration({ type: "eventNotFound" });
					return;
				}

				dispatchRegistration({ type: "eventLoaded", useOpass: foundEvent.useOpass ?? true, opassEventId: foundEvent.opassEventId ?? null });

				const registrations = await registrationsAPI.getAll();
				eventRegistration = findEventRegistration(registrations.data, foundEvent.id);
			} catch (error) {
				console.error("Failed to load registrations:", error);
				dispatchRegistration({ type: "failed" });
				return;
			}

			if (!eventRegistration) {
				dispatchRegistration({ type: "missingRegistration" });
				return;
			}
			// A pending row is only an unfinished seat hold, not a completed registration.
			if (eventRegistration.status === "pending") {
				dispatchRegistration({ type: "pendingRegistration" });
				return;
			}

			let ticketname = getLocalizedText(eventRegistration.ticket?.name, locale) || "Ticket";
			ticketname = ticketname
				.replace(/\(.*?\)/g, "")
				.replace(/（.*?）/g, "")
				.trim();
			const isRegistrationCancelled = eventRegistration.status === "cancelled";
			dispatchRegistration({
				type: "registrationLoaded",
				registrationId: eventRegistration.id,
				registrationTime: eventRegistration.createdAt,
				registerationTicketName: ticketname,
				isCancelled: isRegistrationCancelled,
				checkedIn: isRegistrationCancelled ? false : (eventRegistration.checkedIn ?? false)
			});
			if (isRegistrationCancelled) return;

			if (autoCheckin) {
				await openQRCode(eventRegistration.id, eventRegistration.createdAt);
			}
			try {
				const code = (await referralsAPI.getReferralLink(eventRegistration.id)).data.referralCode;
				dispatchRegistration({ type: "referralLoaded", referralCode: code });
			} catch (error) {
				console.error("Failed to load referral code:", error);
				dispatchRegistration({ type: "referralFailed" });
			}
		};
		void loadSuccessInfo();
	}, [autoCheckin, eventSlug, locale]);

	useEffect(() => {
		const handleResize = () => {
			setIsScreenReallySmall(window.innerWidth < 315);
		};
		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const eventPath = `/${eventSlug}`;

	if (pageStatus === "loading") {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner />
			</div>
		);
	}
	if (pageStatus === "eventNotFound") {
		return <StatusView title={t.eventNotFound} backHref="/" backLabel={t.backToHome} />;
	}
	if (pageStatus === "error") {
		return <StatusView title={t.loadFailed} backHref={eventPath} backLabel={t.backToEvent} />;
	}
	if (pageStatus === "notRegistered") {
		return <StatusView title={t.notRegisteredTitle} backHref={eventPath} backLabel={t.backToEvent} />;
	}
	if (pageStatus === "pending") {
		return <StatusView title={t.pendingTitle} description={t.pendingDesc} backHref={eventPath} backLabel={t.backToEvent} />;
	}

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-[60%_40%] md:grid-cols-[50%_50%] max-w-full overflow-hidden">
				<section className="pt-20 px-4 flex flex-col justify-center sm:items-end items-center min-w-0">
					<div className="flex w-full max-w-md flex-col gap-4">
						<h1 className="my-4 text-5xl font-bold">{isCancelled ? t.cancelled : t.success}</h1>
						{isCancelled && <p className="text-muted-foreground">{t.cancelledDesc}</p>}
						{!isCancelled && checkedIn && (
							<span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:text-green-400 dark:ring-green-400/20">
								<CheckCheck size={16} />
								{t.checkedIn}
							</span>
						)}
						{!isCancelled && <p>{t.emailCheck}</p>}
						{!isCancelled && (
							<>
								<p>{t.inviteFriends}</p>
								<ReferralCodeCopyButton referral={referral} t={t} copiedCode={copiedCode} onCopy={handleCopyRefCode} />
								<p>{t.copyInviteLink}</p>
								<ReferralUrlCopyButton referral={referral} t={t} copiedUrl={copiedUrl} eventSlug={eventSlug} locale={locale} isScreenReallySmall={isScreenReallySmall} onCopy={handleCopyRefUrl} />
								<h3 className="text-xl font-semibold mt-2">{t.qrDesc}</h3>
								{registrationId && registrationTime && (
									<Button onClick={() => void openQRCode(registrationId, registrationTime)} className="flex items-center gap-2 mb-2">
										<CheckCheck size={24} /> {t.viewQRCode}
									</Button>
								)}
							</>
						)}
						<div className="border-t-2 border-gray-700" />
						<div className="mt-2 flex flex-wrap gap-4">
							{registrationId && (
								<Button
									className="flex-1 px-3"
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
									className="flex-1 px-3"
									isLoading={viewRefLoading}
									onClick={() => {
										dispatchNavigationLoading({ type: "viewReferral" });
										router.push(`${eventPath}/referral-status`);
									}}
								>
									{t.viewReferralStatus}
								</Button>
							)}
						</div>
						<Button variant="outline" className="w-fit" onClick={() => router.push(eventPath)}>
							<ArrowLeft size={18} /> {t.backToEvent}
						</Button>
					</div>
				</section>
				<div ref={lanyardAnchorRef} className="hidden sm:block h-screen">
					<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} name={registerationTicketName || undefined} anchorRef={lanyardAnchorRef} />
				</div>
			</div>
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
