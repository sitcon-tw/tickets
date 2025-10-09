"use client";

import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

interface QRCodePopupProps {
	isOpen: boolean;
	onClose: () => void;
	registrationId: string;
	registrationTime: string;
}

export default function QRCodePopup({ isOpen, onClose, registrationId, registrationTime }: QRCodePopupProps) {
	const [qrValue, setQrValue] = useState<string>("");

	useEffect(() => {
		const generateHash = async () => {
			const text = registrationId + registrationTime;
			const encoder = new TextEncoder();
			const data = encoder.encode(text);
			const hashBuffer = await crypto.subtle.digest("SHA-256", data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
			setQrValue(hashHex);
		};

		if (isOpen && registrationId && registrationTime) {
			generateHash();
		}
	}, [isOpen, registrationId, registrationTime]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 bg-opacity-50" onClick={onClose}>
			<div className="relative bg-gray-800 dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
				<button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" aria-label="Close">
					<X size={24} />
				</button>

				<div className="flex flex-col items-center gap-4">
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your QR Code</h2>

					{qrValue ? (
						<div className="bg-white p-4 rounded-lg">
							<QRCodeSVG value={qrValue} size={256} level="H" bgColor="#222222" fgColor="#ffffff" />
						</div>
					) : (
						<div className="w-64 h-64 flex items-center justify-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
						</div>
					)}

					<p className="text-sm text-gray-600 dark:text-gray-400 text-center">Scan this QR code for verification</p>
				</div>
			</div>
		</div>
	);
}
