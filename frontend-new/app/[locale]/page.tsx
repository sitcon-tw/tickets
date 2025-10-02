"use client";

import React, { useEffect } from 'react';
import Header from "@/components/home/Header";
import Welcome from "@/components/home/Welcome";
import Tickets from "@/components/home/Tickets";
import Info from "@/components/home/Info";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import * as i18n from "@/lib/i18n";
import { usePathname, useRouter } from 'next/navigation';

export default function Main() {
	const router = useRouter();
	const lang = i18n.local(usePathname());
	const t = i18n.t(lang, {
		title: {
			"zh-Hant": "Fastro - 毛哥EM的網站起始模板",
			"zh-Hans": "Fastro - 毛哥EM的网站起始模板",
			en: "Fastro - EM's Website Starter"
		},
		description: {
			"zh-Hant": "毛哥EM的網站起始模板，使用Astro和Fastify構建。",
			"zh-Hans": "毛哥EM的网站起始模板，使用Astro和Fastify构建。",
			en: "Elvis Mao's Website starter template using Astro and Fastify."
		}
	});

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const referralCode = urlParams.get('ref');

		if (referralCode) {
			sessionStorage.setItem('referralCode', referralCode);
			router.replace(window.location.pathname + window.location.search.replace(/([?&])ref=[^&]*&?/, '$1').replace(/&$/, '') + window.location.hash);
		}
	}, [router]);

	return (
		<>
			<Nav />
			<main>
				<Header />
				<Welcome />
				<Tickets />
				<Info />
				<Footer />
			</main>
		</>
	);
};