"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { QRCodePopupProps } from "@/lib/types/components";
import generateHash from "@/lib/utils/hash";
import { Check, Copy, ExternalLink, TriangleAlert, X } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export default function QRCodePopup({ isOpen, onClose, registrationId, registrationTime, useOpass = true, opassEventId }: QRCodePopupProps) {
	const locale = useLocale();

	const [qrValue, setQrValue] = useState<string>("");
	const [copied, setCopied] = useState<boolean>(false);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "報到方式", "zh-Hans": "报到方式", en: "Check-in Method" },
		openInOpass: {
			"zh-Hant": "使用 OPass APP 開啟票券：",
			"zh-Hans": "使用 OPass APP 开启票券：",
			en: "Open ticket in OPass APP:"
		},
		openOpassLink: {
			"zh-Hant": "點此開啟 OPass",
			"zh-Hans": "点此开启 OPass",
			en: "Click to open OPass"
		},
		or: { "zh-Hant": "或", "zh-Hans": "或", en: "or" },
		useQrCode: { "zh-Hant": "使用此 QR Code 進行驗證", "zh-Hans": "使用此 QR Code 进行验证", en: "Use this QR Code for verification" },
		scanInfo: {
			"zh-Hant": "若無法使用 OPass 進行報到，請向服務台人員出示此 QR Code 以進行驗證",
			"zh-Hans": "若无法使用 OPass 进行报到，请向服务台人员出示此 QR Code 以进行验证",
			en: "If you cannot use OPass for check-in, please show this QR code to the service desk staff for verification"
		},
		scanInfoOpassDisabled: {
			"zh-Hant": "請向服務台人員出示此 QR Code 以進行驗證",
			"zh-Hans": "请向服务台人员出示此 QR Code 以进行验证",
			en: "Please show this QR code to the service desk staff for verification"
		},
		qrAlert: {
			"zh-Hant": "請勿將此 QR Code 外洩給他人，不然他可以偷你資料。",
			"zh-Hans": "请勿将此 QR Code 外泄给他人，不然他可以偷你资料。",
			en: "Please do not share this QR code with others or they will steal your data."
		}
	});

	function copyToClipboard() {
		if (qrValue) {
			navigator.clipboard.writeText(qrValue).then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			});
		}
	}

	useEffect(() => {
		if (isOpen && registrationId && registrationTime) {
			generateHash(registrationId, registrationTime).then(hash => {
				setQrValue(hash);
			});
		}
	}, [isOpen, registrationId, registrationTime]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
			<div className="relative bg-white/80 dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl p-8 mx-4" onClick={e => e.stopPropagation()}>
				<Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4" aria-label="Close">
					<X size={24} />
				</Button>

				<div className="flex flex-col items-center gap-4">
					<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t.title}</h2>
					{useOpass && opassEventId && qrValue && (
						<>
							<p className="text-md text-gray-700 dark:text-gray-300 text-center sm:flex items-center gap-1">
								<span>{t.openInOpass} </span>
								<Link
									href={`https://opass.app/open/?event_id=${opassEventId}&token=${qrValue}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:underline flex items-center gap-1"
								>
									{t.openOpassLink}
									<ExternalLink size={16} />
								</Link>
							</p>
							<div className="flex w-full space-x-4 px-8 items-start">
								<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
								<p className="text-md text-gray-700 dark:text-gray-200 text-center">{t.or}</p>
								<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
							</div>
						</>
					)}
					<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t.useQrCode}</h3>

					{qrValue ? (
						<div className="flex flex-col items-center gap-3">
							<div className="rounded-lg border-16 border-white w-fit">
								<QRCodeSVG
									value={qrValue}
									size={256}
									level="H"
									bgColor="white"
									fgColor="var(--color-gray-800)"
									imageSettings={{
										src: "/assets/SITCON.svg",
										height: 80,
										width: 64,
										opacity: 1,
										excavate: true
									}}
								/>
							</div>
							<div className="flex items-center justify-center space-x-2 cursor-pointer text-gray-800 dark:text-gray-300" onClick={copyToClipboard}>
								<p className="text-xs">{qrValue.slice(0, 10) + "..." + qrValue.slice(-10)}</p>
								{copied ? <Check size={12} className="text-green-600 dark:text-green-300" /> : <Copy size={12} />}
							</div>
						</div>
					) : (
						<div className="w-64 h-64 flex items-center justify-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
						</div>
					)}

					<p className="text-md text-gray-800 dark:text-gray-200 text-center">{useOpass && opassEventId ? t.scanInfo : t.scanInfoOpassDisabled}</p>
					<p className="text-xs text-yellow-600 dark:text-yellow-200 flex items-center text-center gap-1">
						<TriangleAlert size={20} />
						{t.qrAlert}
					</p>
				</div>
			</div>
		</div>
	);
}
