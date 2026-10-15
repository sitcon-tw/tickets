import { getTranslations } from "@/i18n/helpers";
import { SpinnerProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

const sizeClasses = {
	sm: "w-4 h-4 border-2",
	md: "w-6 h-6 border-2",
	lg: "w-8 h-8 border-3"
};

export default function Spinner({ size = "md", className }: SpinnerProps) {
	const locale = useLocale();
	const t = getTranslations(locale, { loading: { "zh-Hant": "載入中", en: "Loading" } });

	return <output className={cn("inline-block rounded-full border-transparent border-t-current animate-spin", sizeClasses[size], className)} aria-label={t.loading} />;
}
