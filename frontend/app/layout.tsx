import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"]
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"]
});

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

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html>
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<meta name="generator" content="Next.js" />
				<meta name="theme-color" content="#000" />
			</head>

			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				{children}
				<Toaster richColors position="bottom-center" />
			</body>

			{/* Google Tag Manager */}
			<GoogleTagManager gtmId="GTM-NPVBCDZ" />
		</html>
	);
}
