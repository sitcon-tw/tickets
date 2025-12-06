"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { routing } from "@/i18n/routing";
import { Globe, Heart } from "lucide-react";
import { useRouter as useNextRouter, usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Footer() {
	const pathname = usePathname();
	const router = useNextRouter();

	// Detect locale from pathname since we're outside NextIntlClientProvider
	const locale = useMemo(() => {
		const detectedLocale = routing.locales.find(loc => pathname.startsWith(`/${loc}`));
		return detectedLocale || routing.defaultLocale;
	}, [pathname]);

	const localeNames: Record<string, string> = {
		en: "English",
		"zh-Hant": "繁體中文",
		"zh-Hans": "简体中文"
	};

	const handleLocaleChange = (newLocale: string) => {
		// Replace the locale part in the pathname
		const pathWithoutLocale = pathname.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
		router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
	};

	// const isAdminPage = pathname.includes("/admin");
	const isMagicLinkPage = pathname.includes("/magic-link");

	if (isMagicLinkPage) {
		return null;
	}

	return (
		<footer className="text-center p-6 mt-8 text-gray-600 dark:text-gray-400">
			<div className="flex justify-center items-center gap-2 mb-3">
				<Globe size={16} className="text-muted-foreground" />
				<Select value={locale} onValueChange={handleLocaleChange}>
					<SelectTrigger className="w-[140px] h-8 text-sm">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{routing.locales.map(loc => (
							<SelectItem key={loc} value={loc}>
								{localeNames[loc]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex justify-center items-center gap-1">
				<p className="text-muted-foreground">
					Made by{" "}
					<a href="https://sitcon.org" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">
						SITCON
					</a>{" "}
					with{" "}
				</p>
				<Heart size={16} className="text-red-700 hover:text-blue-600 transition-colors cursor-pointer" />
			</div>
			<p className="text-sm text-muted-foreground mt-1">
				<a href="https://github.com/sitcon-tw/tickets" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">
					View on GitHub
				</a>
				・
				<a href={`/${locale}/terms`} className="hover:text-blue-600 transition-colors">
					ToS & PP
				</a>
			</p>
		</footer>
	);
}
