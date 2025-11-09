"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

	if (pathname.includes("/admin") || pathname.includes("/magic-link")) {
		return null;
	}

	return (
		<footer className="text-center p-0 mt-8">
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
					Made by EM & Nelson from{" "}
					<a href="https://sitcon.org" target="_blank" rel="noreferrer" className="underline hover:text-foreground transition-colors">
						SITCON
					</a>{" "}
					with{" "}
				</p>
				<Heart size={16} className="text-red-700" />
			</div>
			<p className="text-sm text-muted-foreground mt-1">
				This project is open-sourced on{" "}
				<a href="https://github.com/sitcon-tw/tickets" target="_blank" rel="noreferrer" className="underline hover:text-foreground transition-colors">
					GitHub
				</a>
				.
				<a href={`/${locale}/terms`} className="underline hover:text-foreground transition-colors ml-2">
					ToS & PP
				</a>
			</p>
		</footer>
	);
}
