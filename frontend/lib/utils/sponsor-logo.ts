import { SPONSOR_LOGO_DATA_URL_MAX_LENGTH } from "@sitcontix/types";
import type { CSSProperties } from "react";

export const DEFAULT_LOGO_BG = "#ffffff";
export const DEFAULT_LOGO_DARK_BG = "#111827";

export const LOGO_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

const LOGO_DATA_URL_PATTERN = /^data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;
const ACCEPTED_TYPES = new Set(LOGO_UPLOAD_ACCEPT.split(","));
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 800;

export function isWebUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function isLogoDataUrl(value: string) {
	return value.length <= SPONSOR_LOGO_DATA_URL_MAX_LENGTH && LOGO_DATA_URL_PATTERN.test(value);
}

/** A logo can be an http(s) link or an uploaded image (data URL). */
export function isLogoSource(value: string) {
	return isWebUrl(value) || isLogoDataUrl(value);
}

/** Only http(s) links and uploaded images are ever used as an image source, whatever the API returned. */
export function safeLogoSrc(value: string | null | undefined) {
	if (!value) return null;
	if (isLogoDataUrl(value)) return value;
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
	} catch {
		return null;
	}
}

type LogoBackground = {
	logoBgColor?: string | null;
	logoDarkBgColor?: string | null;
	logoDarkUrl?: string | null;
};

/** The two colors used behind a logo in light and dark mode. */
export function logoBackgrounds({ logoBgColor, logoDarkBgColor, logoDarkUrl }: LogoBackground) {
	const light = logoBgColor || DEFAULT_LOGO_BG;
	// A dedicated dark logo was designed for a dark card, so keep the old dark default for it.
	const dark = logoDarkBgColor || (logoDarkUrl ? DEFAULT_LOGO_DARK_BG : light);
	return { light, dark };
}

/** CSS variables for `LOGO_BG_CLASS`. */
export function logoBackgroundStyle(sponsor: LogoBackground): CSSProperties {
	const { light, dark } = logoBackgrounds(sponsor);
	return { "--sponsor-bg": light, "--sponsor-bg-dark": dark } as CSSProperties;
}

export const LOGO_BG_CLASS = "bg-[color:var(--sponsor-bg)] dark:bg-[color:var(--sponsor-bg-dark)]";

export type LogoUploadErrorReason = "type" | "inputTooLarge" | "tooLarge" | "decode";

export class LogoUploadError extends Error {
	constructor(readonly reason: LogoUploadErrorReason) {
		super(reason);
	}
}

function readAsDataUrl(blob: Blob) {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new LogoUploadError("decode")));
		reader.onerror = () => reject(new LogoUploadError("decode"));
		reader.readAsDataURL(blob);
	});
}

/**
 * Turn an uploaded image into a data URL small enough to store with the sponsor.
 * SVGs are kept as-is; PNG / JPEG / WebP are downscaled and re-encoded (transparency is kept).
 */
export async function fileToLogoDataUrl(file: File): Promise<string> {
	if (!ACCEPTED_TYPES.has(file.type)) throw new LogoUploadError("type");
	if (file.size > MAX_INPUT_BYTES) throw new LogoUploadError("inputTooLarge");

	if (file.type === "image/svg+xml") {
		const dataUrl = await readAsDataUrl(file);
		if (dataUrl.length > SPONSOR_LOGO_DATA_URL_MAX_LENGTH) throw new LogoUploadError("tooLarge");
		return dataUrl;
	}

	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		throw new LogoUploadError("decode");
	}

	try {
		const baseScale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
		// Shrink step by step until the encoded image fits.
		for (const factor of [1, 0.75, 0.5, 0.35]) {
			const scale = baseScale * factor;
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			const context = canvas.getContext("2d");
			if (!context) throw new LogoUploadError("decode");
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

			const dataUrl = canvas.toDataURL("image/webp", 0.9);
			if (dataUrl.length <= SPONSOR_LOGO_DATA_URL_MAX_LENGTH) return dataUrl;
		}
		throw new LogoUploadError("tooLarge");
	} finally {
		bitmap.close();
	}
}
