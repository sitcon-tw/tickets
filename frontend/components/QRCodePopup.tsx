"use client";

import { getTranslations } from "@/i18n/helpers";
import generateHash from "@/lib/utils/hash";
import { ExternalLink, TriangleAlert, X } from "lucide-react";
import { useLocale } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QRCodePopupProps {
	isOpen: boolean;
	onClose: () => void;
	registrationId: string;
	registrationTime: string;
}

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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
			<div className="relative bg-gray-800 rounded-lg max-w-md w-full shadow-xl" style={{ padding: "32px", margin: "0 16px" }} onClick={e => e.stopPropagation()}>
				<button onClick={onClose} className="absolute text-gray-500 hover:text-gray-700  transition-colors" style={{ top: "16px", right: "16px" }} aria-label="Close">
					<X size={24} />
				</button>

				<div className="flex flex-col items-center" style={{ gap: "16px" }}>
					<h2 className="text-2xl font-bold">{t.title}</h2>
					<p className="text-md text-gray-200 text-center flex">
						{t.downloadOpass}{" "}
						<a href="https://opass.app/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center" style={{ gap: "0.2rem" }}>
							opass.app
							<ExternalLink size={16} />
						</a>
					</p>
					<p className="text-md text-gray-200 text-center">{t.or}</p>
					<h3 className="text-xl font-semibold">{t.useQrCode}</h3>

					{qrValue ? (
						<div className="rounded-lg" style={{ padding: "16px" }}>
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

					<p className="text-md text-gray-200 text-center">{t.scanInfo}</p>
					<p className="text-xs text-yellow-200 flex items-center text-center">
						<TriangleAlert size={20} style={{ marginRight: "4px" }} />
						{t.qrAlert}
					</p>
				</div>
			</div>
		</div>
	);
}
