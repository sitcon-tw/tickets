import { getTranslations } from "@/i18n/helpers";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import DecryptedText from "./DecryptedText";

interface PageSpinnerProps {
	size?: number;
	className?: string;
}

export default function PageSpinner({ size = 48, className }: PageSpinnerProps) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Now Loading..." }
	});

	return (
		<>
			<div
				className={cn("inline-block animate-spin", className)}
				style={{ width: size, height: size }}
				role="status"
				aria-label="Loading"
			>
				<Image
					src="/assets/small-stone.png"
					alt="Loading"
					width={size}
					height={size}
					className="block"
				/>
			</div>
			<DecryptedText text={t.loading} animateOn="view" />
		</>
	);
}
