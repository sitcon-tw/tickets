import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import Image from "next/image";
import DecryptedText from "./DecryptedText";
import { usePathname } from "next/navigation";

export default function PageSpinner() {
	const locale = useLocale();
	const t = getTranslations(locale, {
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." }
	});
  // this method is really dumb, maybe fix them in the future -ns
	const isAdminPage = usePathname().includes("/admin");

	return (
		<div className={`flex flex-col items-center justify-center ${isAdminPage ? "h-max" : "h-screen"}`}>
			<Image src="/assets/small-stone.png" alt="Loading..." width={48} height={48} className="block animate-spin mb-6" />
			<DecryptedText text={t.loading} animateOn="view" />
		</div>
	);
}
