"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QRScannerProps {
	isOpen: boolean;
	onClose: () => void;
	onScan: (decodedText: string) => void;
	title?: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title = "Scan QR Code" }: QRScannerProps) {
	const [isScanning, setIsScanning] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const scannerIdRef = useRef<string>("qr-reader");

	useEffect(() => {
		if (isOpen && !isScanning) {
			startScanning();
		}

		return () => {
			stopScanning();
		};
	}, [isOpen]);

	const startScanning = async () => {
		try {
			setError(null);
			const html5QrCode = new Html5Qrcode(scannerIdRef.current);
			scannerRef.current = html5QrCode;

			await html5QrCode.start(
				{ facingMode: "environment" },
				{
					fps: 10,
					qrbox: { width: 250, height: 250 }
				},
				(decodedText) => {
					// Successfully scanned
					onScan(decodedText);
					stopScanning();
					onClose();
				},
				(errorMessage) => {
					// Scanning error (not critical, happens frequently)
					// Only log severe errors
					if (!errorMessage.includes("NotFoundException")) {
						console.debug("QR scan error:", errorMessage);
					}
				}
			);

			setIsScanning(true);
		} catch (err) {
			console.error("Failed to start QR scanner:", err);
			setError(err instanceof Error ? err.message : "Failed to start camera");
			setIsScanning(false);
		}
	};

	const stopScanning = async () => {
		if (scannerRef.current) {
			try {
				if (scannerRef.current.isScanning) {
					await scannerRef.current.stop();
				}
				scannerRef.current.clear();
			} catch (err) {
				console.error("Error stopping scanner:", err);
			}
			scannerRef.current = null;
		}
		setIsScanning(false);
	};

	const handleClose = () => {
		stopScanning();
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Camera size={24} />
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{error && (
						<div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
							{error}
						</div>
					)}

					<div className="relative w-full aspect-square bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden">
						<div id={scannerIdRef.current} className="w-full h-full" />
					</div>

					{isScanning && (
						<div className="text-center text-sm text-gray-600 dark:text-gray-400">
							Position the QR code within the frame
						</div>
					)}

					<Button variant="secondary" onClick={handleClose} className="w-full">
						<X size={16} />
						Cancel
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
