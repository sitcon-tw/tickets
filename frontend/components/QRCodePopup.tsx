"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { QRCodePopupProps } from "@/lib/types/components";
import generateHash from "@/lib/utils/hash";
import { ExternalLink, TriangleAlert, X } from "lucide-react";
import { useLocale } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export default function QRCodePopup({ isOpen, onClose, registrationId, registrationTime }: QRCodePopupProps) {
	const locale = useLocale();

	const [qrValue, setQrValue] = useState<string>("");

	const t = getTranslations(locale, {
		title: { "zh-Hant": "報到方式", "zh-Hans": "报到方式", en: "Check-in Method" },
		downloadOpass: { "zh-Hant": "您可以下載 OPass APP 進行報到：", "zh-Hans": "您可以下载 OPass APP 进行报到：", en: "You can download the OPass APP for check-in:" },
		or: { "zh-Hant": "或", "zh-Hans": "或", en: "or" },
		useQrCode: { "zh-Hant": "使用此 QR Code 進行報到", "zh-Hans": "使用此 QR Code 进行报到", en: "Use this QR Code for check-in" },
		scanInfo: { "zh-Hant": "向工作人員出示此 QR Code 以進行驗證", "zh-Hans": "向工作人员出示此 QR Code 以进行验证", en: "Show this QR code to the staff for verification" },
		qrAlert: {
			"zh-Hant": "請勿將此 QR Code 外洩給他人，不然他可以偷你資料。",
			"zh-Hans": "请勿将此 QR Code 外泄给他人，不然他可以偷你资料。",
			en: "Please do not share this QR code with others or they will steal your data."
		}
	});

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
					<p className="text-md text-gray-700 dark:text-gray-300 text-center sm:flex items-center gap-1">
						{t.downloadOpass}{" "}
						<a href="https://opass.app/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
							opass.app
							<ExternalLink size={16} />
						</a>
					</p>
					<div className="flex w-full space-x-4 px-8 items-start">
						<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
						<p className="text-md text-gray-700 dark:text-gray-200 text-center">{t.or}</p>
						<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
					</div>
					<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t.useQrCode}</h3>

					{qrValue ? (
						<div className="rounded-lg border-16 border-gray-800">
							<QRCodeSVG
								value={qrValue}
								size={256}
								level="H"
								bgColor="var(--color-gray-800)"
								fgColor="#ffffff"
								imageSettings={{
									src: "/assets/SITCON_WHITE.svg",
									height: 80,
									width: 64,
									opacity: 1,
									excavate: true
								}}
							/>
						</div>
					) : (
						<div className="w-64 h-64 flex items-center justify-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
						</div>
					)}

					<p className="text-md text-gray-800 dark:text-gray-200 text-center">{t.scanInfo}</p>
					<p className="text-xs text-yellow-600 dark:text-yellow-200 flex items-center text-center gap-1">
						<TriangleAlert size={20} />
						{t.qrAlert}
					</p>
				</div>
			</div>
		</div>
	);
}
