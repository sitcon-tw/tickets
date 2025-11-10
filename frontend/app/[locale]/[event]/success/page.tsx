"use client";

import Lanyard from "@/components/Lanyard";
import QRCodePopup from "@/components/QRCodePopup";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { eventsAPI, referralsAPI, registrationsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { ArrowLeft, Check, CheckCheck, Copy } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Success() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const router = useRouter();
	const params = useParams();
	const eventSlug = params.event as string;

	const [referralCode, setReferralCode] = useState<string>("Loading...");
	const [copiedCode, setCopiedCode] = useState(false);
	const [copiedUrl, setCopiedUrl] = useState(false);
	const [viewRefLoading, setViewRefLoading] = useState(false);
	const [viewRegLoading, setViewRegLoading] = useState(false);
	const [registrationId, setRegistrationId] = useState<string | null>(null);
	const [registerationTicketName, setRegistrationTicketName] = useState<string | null>(null);
	const [registrationTime, setRegistrationTime] = useState<string | null>(null);
	const [showQRCode, setShowQRCode] = useState(false);

	const t = getTranslations(locale, {
		success: {
			"zh-Hant": "報名成功！",
			"zh-Hans": "报名成功！",
			en: "You're In!"
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
					const foundEvent = eventsData.data.find(e => e.id.slice(-6) === eventSlug);

					if (!foundEvent) {
						setReferralCode(t.loadFailed);
						return;
					}

					const currentEventId = foundEvent.id;

					const registrations = await registrationsAPI.getAll();
					const eventRegistration = registrations.data.find(reg => reg.event?.id === currentEventId);
					if (eventRegistration) {
						setRegistrationId(eventRegistration.id);
						setRegistrationTime(eventRegistration.createdAt);
						setRegistrationTicketName(getLocalizedText(eventRegistration.ticket?.name, locale) || null);
						const code = (await referralsAPI.getReferralLink(eventRegistration.id)).data.referralCode;
						setReferralCode(code);
					} else {
						setReferralCode(t.loadFailed);
					}
				} catch (error) {
					console.error("Failed to load registrations:", error);
					setReferralCode(t.loadFailed);
				}
			} catch (error) {
				console.error("Failed to load success info:", error);
				const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
				window.location.href = `/login/?returnUrl=${returnUrl}`;
			}
		};
		loadSuccessInfo();
	}, [eventSlug, locale, t.loadFailed]);

	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-[50%_50%] md:grid-cols-[40%_60%] max-w-full overflow-hidden">
				<section className="pt-20 flex flex-col justify-center sm:items-end items-center">
					<div className="flex flex-col gap-4">
						<h1 className="my-4 text-5xl font-bold">{t.success}</h1>
						<p>{t.emailCheck}</p>
						<p>{t.inviteFriends}</p>
						<div onClick={handleCopyRefCode} className="cursor-pointer border-2 border-gray-500 hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-1 px-2">
							{referralCode === t.loading ? (
								<Spinner />
							) : (
								<div className="flex items-center gap-2">
									<span className="font-mono text-lg">{referralCode}</span>
									{referralCode !== t.loadFailed && (
										<span className="cursor-pointer" title={t.copyInvite}>
											{copiedCode ? <Check className="text-green-500" /> : <Copy />}
										</span>
									)}
								</div>
							)}
						</div>
						<p>{t.copyInviteLink}</p>
						<div onClick={handleCopyRefUrl} className="cursor-pointer border-2 border-gray-500 hover:bg-gray-700 transition-all duration-200 rounded-md w-min p-1 px-2">
							{referralCode === t.loading ? (
								<Spinner />
							) : referralCode === t.loadFailed ? (
								<span className="font-mono text-lg">{`${t.loadFailed}`}</span>
							) : (
								<div className="flex items-center gap-2">
									<span className="font-mono text-lg" title={`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`}>
										{`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`.length > 20 && !locale.includes("zh")
											? `${`${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`.substring(0, 20)}...`
											: `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/${eventSlug}?ref=${referralCode}`}
									</span>
									{referralCode !== t.loadFailed && (
										<span className="cursor-pointer" title={t.copyInvite}>
											{copiedUrl ? <Check className="text-green-500" /> : <Copy />}
										</span>
									)}
								</div>
							)}
						</div>
						<h3 className="text-xl font-semibold mt-2">{t.qrDesc}</h3>
						{registrationId && registrationTime && (
							<Button onClick={() => setShowQRCode(true)} className="flex items-center gap-2 mb-2">
								<CheckCheck size={24} /> {t.viewQRCode}
							</Button>
						)}
						<div className="border-t-2 border-gray-700" />
						<div className={`gap-4 mt-2 ${locale.includes("zh") && "flex flex-wrap"}`}>
							{registrationId && (
								<Button
									onClick={() => {
										setViewRegLoading(true);
										router.push(`/my-registration/${registrationId}`);
									}}
								>
									{viewRegLoading && <Spinner size="sm" />} {t.viewMyRegistration}
								</Button>
							)}
							<Button
								onClick={() => {
									setViewRefLoading(true);
									router.push(`${window.location.href.replace(/\/success$/, "")}/referral-status`);
								}}
							>
								{viewRefLoading && <Spinner size="sm" />} {t.viewReferralStatus}
							</Button>
						</div>
						<Button onClick={() => router.push(`${window.location.href.replace(/\/success$/, "")}`)}>
							<ArrowLeft size={24} />
						</Button>
					</div>
				</section>
				<div className="relative overflow-hidden hidden sm:block">
					<Lanyard position={[0, 0, 20]} gravity={[0, -40, 0]} name={registerationTicketName || undefined} />
				</div>
			</div>
			{registrationId && registrationTime && <QRCodePopup isOpen={showQRCode} onClose={() => setShowQRCode(false)} registrationId={registrationId} registrationTime={registrationTime} />}
		</>
	);
}
