import IntlLayoutWrapper from "@/components/IntlLayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from "@next/third-parties/google";

import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
	title: "SITCONTIX",
	description: "趕快來報名 SITCON 的活動吧！",
	openGraph: {
		title: "SITCONTIX",
		description: "趕快來報名 SITCON 的活動吧！",
		siteName: "SITCONTIX",
		type: "website"
	},
	twitter: {
		card: "summary_large_image",
		title: "SITCONTIX",
		description: "趕快來報名 SITCON 的活動吧！"
	}
};

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning className="h-full">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="generator" content="Next.js" />
			</head>

			<body suppressHydrationWarning>
				<ThemeProvider>
					<IntlLayoutWrapper>{children}</IntlLayoutWrapper>
					<Toaster richColors position="bottom-center" />
				</ThemeProvider>
			</body>

			{/* Google Tag Manager */}
			<GoogleTagManager gtmId="GTM-NPVBCDZ" />
		</html>
	);
}
