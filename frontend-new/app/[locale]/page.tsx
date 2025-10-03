"use client";

import React, { useEffect } from 'react';
import Header from "@/components/home/Header";
import Welcome from "@/components/home/Welcome";
import Tickets from "@/components/home/Tickets";
import Info from "@/components/home/Info";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { useRouter } from '@/i18n/navigation';

export default function Main() {
	const router = useRouter();

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