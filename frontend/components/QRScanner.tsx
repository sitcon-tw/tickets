"use client";

import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { cn } from "@/lib/utils";
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

type QRScannerProps = {
	/** Camera is only on while this is true; turn it off when the scanner is hidden. */
	active: boolean;
	/** Called with the decoded text. The same code is not reported again for `cooldownMs`. */
	onScan: (decodedText: string) => void;
	cooldownMs?: number;
	className?: string;
};

type Camera = { id: string; label: string };

async function stopScanner(scanner: Html5Qrcode, container: HTMLElement | null) {
	try {
		// Not `scanner.isScanning`: that only flips once the video fires "playing", which may never happen if the element was already removed
		const state = scanner.getState();
		if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) await scanner.stop();
	} catch (error) {
		console.error("Failed to stop QR scanner:", error);
	}
	try {
		scanner.clear();
	} catch {
		// Nothing left to clear
	}
	// Whatever the library state was, never leave the camera running
	container?.querySelectorAll("video").forEach(video => {
		if (video.srcObject instanceof MediaStream) video.srcObject.getTracks().forEach(track => track.stop());
		video.srcObject = null;
	});
}

/** Live camera QR scanner. Renders a camera preview and keeps scanning until `active` becomes false. */
export default function QRScanner({ active, onScan, cooldownMs = 3000, className }: QRScannerProps) {
	const locale = useLocale();
	const elementId = `qr-reader-${useId().replace(/:/g, "")}`;
	const containerRef = useRef<HTMLDivElement>(null);

	const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "error">("idle");
	const [errorKind, setErrorKind] = useState<"denied" | "noCamera" | "insecure" | "unknown">("unknown");
	const [cameras, setCameras] = useState<Camera[]>([]);
	const [cameraId, setCameraId] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);

	// The latest callback without restarting the camera whenever the parent re-renders
	const onScanRef = useRef(onScan);
	useEffect(() => {
		onScanRef.current = onScan;
	}, [onScan]);

	// Starting and stopping html5-qrcode is async, so queue them: a restart must wait for the previous stop to finish
	const queueRef = useRef<Promise<void>>(Promise.resolve());
	const lastScanRef = useRef<{ text: string; at: number } | null>(null);

	const t = getTranslations(locale, {
		starting: { "zh-Hant": "正在啟動相機...", "zh-Hans": "正在启动相机...", en: "Starting camera..." },
		hint: { "zh-Hant": "將 QR Code 對準框內", "zh-Hans": "将 QR Code 对准框内", en: "Point the camera at a QR code" },
		denied: {
			"zh-Hant": "無法使用相機。請在瀏覽器網址列允許相機權限後重試。",
			"zh-Hans": "无法使用相机。请在浏览器地址栏允许相机权限后重试。",
			en: "Camera access was blocked. Allow camera permission in the address bar and try again."
		},
		noCamera: { "zh-Hant": "找不到可用的相機。", "zh-Hans": "找不到可用的相机。", en: "No camera was found on this device." },
		insecure: {
			"zh-Hant": "瀏覽器僅在 HTTPS 連線下允許使用相機。",
			"zh-Hans": "浏览器仅在 HTTPS 连接下允许使用相机。",
			en: "Browsers only allow camera access on HTTPS connections."
		},
		unknown: { "zh-Hant": "相機啟動失敗。", "zh-Hans": "相机启动失败。", en: "Failed to start the camera." },
		retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
		switchCamera: { "zh-Hant": "切換相機", "zh-Hans": "切换相机", en: "Switch camera" }
	});

	useEffect(() => {
		if (!active) return;

		if (typeof window !== "undefined" && (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)) {
			setErrorKind(window.isSecureContext ? "noCamera" : "insecure");
			setStatus("error");
			return;
		}

		let cancelled = false;
		// Captured now: by the time the cleanup runs, React may already have detached it
		const container = containerRef.current;
		const scanner = new Html5Qrcode(elementId, {
			formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
			experimentalFeatures: { useBarCodeDetectorIfSupported: true },
			verbose: false
		});

		queueRef.current = queueRef.current.then(async () => {
			if (cancelled) return;
			setStatus("starting");
			try {
				await scanner.start(
					cameraId ?? { facingMode: "environment" },
					{
						fps: 10,
						aspectRatio: 1,
						qrbox: (width, height) => {
							const size = Math.floor(Math.min(width, height) * 0.7);
							return { width: size, height: size };
						}
					},
					decodedText => {
						const now = Date.now();
						const last = lastScanRef.current;
						if (last && last.text === decodedText && now - last.at < cooldownMs) return;
						lastScanRef.current = { text: decodedText, at: now };
						onScanRef.current(decodedText);
					},
					() => {
						// Fired for every frame without a QR code
					}
				);
			} catch (error) {
				if (cancelled) return;
				console.error("Failed to start QR scanner:", error);
				const name = error instanceof Error ? error.name : "";
				const message = String(error);
				setErrorKind(/NotAllowed|Permission/i.test(name + message) ? "denied" : /NotFound|Devices/i.test(name + message) ? "noCamera" : "unknown");
				setStatus("error");
				return;
			}
			if (cancelled) return;
			setStatus("scanning");
			// Labels are only available once the user has granted permission
			Html5Qrcode.getCameras()
				.then(found => {
					if (!cancelled) setCameras(found.map(camera => ({ id: camera.id, label: camera.label })));
				})
				.catch(() => {});
		});

		return () => {
			cancelled = true;
			queueRef.current = queueRef.current.then(() => stopScanner(scanner, container));
		};
	}, [active, attempt, cameraId, cooldownMs, elementId]);

	function switchCamera() {
		if (cameras.length < 2) return;
		const index = cameras.findIndex(camera => camera.id === cameraId);
		// Without an explicit choice the browser picked the back camera; start cycling from the first entry
		setCameraId(cameras[(index + 1) % cameras.length].id);
	}

	const isError = status === "error";

	return (
		<div className={cn("mx-auto flex w-full max-w-sm flex-col gap-3", className)}>
			<div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-black">
				{/* html5-qrcode owns everything inside this element */}
				<div id={elementId} ref={containerRef} className={cn("size-full [&_video]:size-full [&_video]:object-cover", isError && "hidden")} />
				{status === "starting" && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/80">{t.starting}</div>}
				{isError && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
						<CameraOff className="size-8 opacity-70" />
						<p className="text-sm">{t[errorKind]}</p>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setStatus("idle");
								setAttempt(value => value + 1);
							}}
						>
							<RefreshCw className="size-4" />
							{t.retry}
						</Button>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground">{status === "scanning" ? t.hint : " "}</p>
				{cameras.length > 1 && (
					<Button variant="outline" size="sm" onClick={switchCamera}>
						<SwitchCamera className="size-4" />
						{t.switchCamera}
					</Button>
				)}
			</div>
		</div>
	);
}
