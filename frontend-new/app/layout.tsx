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
	title: "SITCON 2026",
	description: "SITCON 2026 Registration System"
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

			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>

			{/* Google Tag Manager */}
			<GoogleTagManager gtmId="GTM-NPVBCDZ" />
		</html>
	);
}
