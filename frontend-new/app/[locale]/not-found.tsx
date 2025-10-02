"use client";

import React from 'react';
import Nav from "@/components/Nav";
import { useLocale } from 'next-intl';
import { getTranslations } from "@/i18n/helpers";

const NotFound: React.FC = () => {
	const locale = useLocale();
	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "找不到頁面",
			"zh-Hans": "找不到页面",
			en: "Page Not Found"
		},
		description: {
			"zh-Hant": "抱歉，您訪問的頁面不存在。",
			"zh-Hans": "抱歉，您访问的页面不存在。",
			en: "Sorry, the page you are looking for does not exist."
		},
		backHome: {
			"zh-Hant": "回首頁",
			"zh-Hans": "回首页",
			en: "Back to Home"
		}
	});

	return (
		<>
			<Nav />
			<main>
				<section>
					<h1>{t.title}</h1>
					<p>{t.description}</p>
					<a className="button" href="/">{t.backHome}</a>
				</section>
			</main>
			<style>{`
				main {
					display: flex;
					flex-direction: column;
					justify-content: center;
					min-height: 100vh;
					min-height: 100svh;
					padding: 2rem;
					text-align: center;
				}

				h1 {
					margin-block: 1rem;
				}

				.button {
					margin: 1rem auto;
				}
			`}</style>
		</>
	);
};

export default NotFound;
