"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Globe, Heart } from "lucide-react";
import { useLocale } from "next-intl";

export default function Footer() {
	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();

	const localeNames: Record<string, string> = {
		en: "English",
		"zh-Hant": "繁體中文",
		"zh-Hans": "简体中文"
	};

	const handleLocaleChange = (newLocale: string) => {
		router.replace(pathname, { locale: newLocale });
	};

	return (
		<footer className="text-center" style={{ padding: "0rem", marginTop: "2rem" }}>
			<div className="flex justify-center items-center" style={{ gap: "0.5rem", marginBottom: "0.75rem" }}>
				<Globe size={16} className="text-gray-500" />
				<select value={locale} onChange={e => handleLocaleChange(e.target.value)} className="bg-transparent text-gray-600 border border-gray-500 rounded text-sm cursor-pointer hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" style={{ padding: "0.25rem 0.5rem" }}>
					{routing.locales.map(loc => (
						<option key={loc} value={loc}>
							{localeNames[loc]}
						</option>
					))}
				</select>
			</div>
			<div className="flex justify-center items-center gap-1">
				<p className="text-gray-400">
					Made by EM & Nelson from{" "}
					<a href="https://sitcon.org" target="_blank" rel="noreferrer" className="underline">
						SITCON
					</a>{" "}
					with{" "}
				</p>
				<Heart size={16} className="text-red-700" />
			</div>
			<p className="text-sm text-gray-500">
				This project is open-sourced on{" "}
				<a href="https://github.com/sitcon/2026-tickets" target="_blank" rel="noreferrer" className="underline">
					GitHub
				</a>
        .
        <a href={`/${locale}/terms`} className="underline" style={{ marginLeft: "0.5rem" }}>ToS & PP</a>
			</p>
		</footer>
	);
}
