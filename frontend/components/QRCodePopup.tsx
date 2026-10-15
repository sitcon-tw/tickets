"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getTranslations } from "@/i18n/helpers";
import { QRCodePopupProps } from "@/lib/types/components";
import { Check, Copy, ExternalLink, TriangleAlert, X } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export default function QRCodePopup({ isOpen, onClose, qrValue, useOpass = true, opassEventId }: QRCodePopupProps) {
	const locale = useLocale();

	const [copied, setCopied] = useState<boolean>(false);

	const t = getTranslations(locale, {
		title: { "zh-Hant": "報到方式", en: "Check-in Method" },
		openInOpass: {
			"zh-Hant": "使用 OPass app 開啟票券：",
			en: "Open ticket in OPass app:"
		},
		openOpassLink: {
			"zh-Hant": "點此開啟 OPass",
			en: "Click to open OPass"
		},
		or: { "zh-Hant": "或", en: "or" },
		useQrCode: { "zh-Hant": "使用此 QR Code 進行驗證", en: "Use this QR Code for verification" },
		scanInfo: {
			"zh-Hant": "若無法使用 OPass 進行報到，請向服務台人員出示此 QR Code 以進行驗證",
			en: "If you cannot use OPass for check-in, please show this QR code to the service desk staff for verification"
		},
		scanInfoOpassDisabled: {
			"zh-Hant": "請向服務台人員出示此 QR Code 以進行驗證",
			en: "Please show this QR code to the service desk staff for verification"
		},
		qrAlert: {
			"zh-Hant": "請勿將此 QR Code 外洩給他人，不然他可以偷吃你便當跟玩大地遊戲。",
			en: "Please do not share this QR code with others or they may use it to check in on your behalf."
		},
		qrAlert2: {
			"zh-Hant": "＊ 此 QR Code 包含之 Token 為 hash，並不包含個人資料。若您想要將您報名後的票分送給其他人，您可以分享 OPass 連結或截圖 QR Code 給他。",
			en: "* The token contained in this QR code is a hash and does not contain personal information. If you want to transfer your ticket to someone else, you can share the OPass link or take a screenshot of the QR code."
		},
		close: { "zh-Hant": "關閉", en: "Close" }
	});

	function copyToClipboard() {
		if (qrValue) {
			void navigator.clipboard.writeText(qrValue).then(() => {
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			});
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent
				overlayClassName="bg-black/40 backdrop-blur-sm"
				showCloseButton={false}
				className="bg-white/80 dark:bg-gray-800 rounded-lg border-0 shadow-xl p-6 sm:p-8 sm:max-w-md md:top-1/2 top-1/2 max-h-[calc(100dvh-2rem)]"
			>
				<DialogClose asChild>
					<Button variant="ghost" size="icon" className="absolute top-4 right-4" aria-label={t.close}>
						<X size={24} />
					</Button>
				</DialogClose>

				<div className="flex flex-col items-center gap-4 min-w-0">
					<DialogTitle className="text-2xl font-bold leading-normal text-gray-800 dark:text-gray-200 px-10 text-center">{t.title}</DialogTitle>
					{useOpass && opassEventId && qrValue && (
						<>
							<p className="text-base text-gray-700 dark:text-gray-300 text-center sm:flex items-center gap-1">
								<span>{t.openInOpass} </span>
								<Link
									href={`https://opass.app/open/?event_id=${opassEventId}&token=${qrValue}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-400 hover:underline inline-flex items-center gap-1"
								>
									{t.openOpassLink}
									<ExternalLink size={16} />
								</Link>
							</p>
							<div className="flex w-full space-x-4 px-8 items-start">
								<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
								<p className="text-base text-gray-700 dark:text-gray-200 text-center">{t.or}</p>
								<div className="flex-1 border-b border-gray-500 dark:border-gray-300 mt-3" />
							</div>
						</>
					)}
					<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 text-center">{t.useQrCode}</h3>

					{qrValue ? (
						<div className="flex w-full flex-col items-center gap-3">
							{/* Up to 256px, but shrinks with the dialog on narrow phones */}
							<div className="rounded-lg border-16 border-white w-full max-w-[288px] bg-white">
								<QRCodeSVG
									value={qrValue}
									size={256}
									level="H"
									bgColor="white"
									fgColor="var(--color-gray-800)"
									className="block h-auto w-full"
									imageSettings={{
										src: "/assets/SITCON.svg",
										height: 80,
										width: 64,
										opacity: 1,
										excavate: true
									}}
								/>
							</div>
							<button type="button" className="flex items-center justify-center space-x-2 cursor-pointer text-gray-800 dark:text-gray-300" onClick={copyToClipboard}>
								<p className="text-xs">{qrValue.slice(0, 10) + "..." + qrValue.slice(-10)}</p>
								{copied ? <Check size={12} className="text-green-600 dark:text-green-300" /> : <Copy size={12} />}
							</button>
						</div>
					) : (
						<div className="aspect-square w-full max-w-64 flex items-center justify-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
						</div>
					)}

					<DialogDescription className="text-base text-gray-800 dark:text-gray-200 text-center">{useOpass && opassEventId ? t.scanInfo : t.scanInfoOpassDisabled}</DialogDescription>
					<div className="text-xs flex text-yellow-600 dark:text-yellow-200 items-center text-center gap-1">
						<TriangleAlert size={20} className="w-[100px]" />
						<span>
							{t.qrAlert}
							{t.qrAlert2}
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
