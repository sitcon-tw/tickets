"use client";

import React from 'react';
import Nav from "@/components/Nav";
import * as i18n from "@/i18n";
import { usePathname } from 'next/navigation';

export default function Terms() {
	const lang = i18n.local(usePathname());
	const t = i18n.t(lang, {
		term: {
			"zh-Hant": "使用者服務條款",
			"zh-Hans": "用户服务条款",
			en: "Terms of Service"
		},
		agree: {
			"zh-Hant": "我同意以上條款",
			"zh-Hans": "我同意以上条款",
			en: "I agree to the above terms"
		},
		signUp: {
			"zh-Hant": "註冊",
			"zh-Hans": "注册",
			en: "Sign Up"
		},
		newAccount: {
			"zh-Hant": "註冊新帳號",
			"zh-Hans": "注册新账号",
			en: "Create New Account"
		}
	});

	const login = () => {
		// Add login logic here
		console.log("Login clicked");
	};

	return (
		<>
			<Nav />
			<main>
				<section>
					<h1>{t.newAccount}</h1>
					<div className="content">
						{/* TODO: Import and render TermsContent markdown */}
						<p>Terms content will go here</p>
					</div>
					<div className="input">
						<input type="checkbox" name="" id="checkbox" />
						<label htmlFor="checkbox">{t.agree}</label>
					</div>
					<button id="submit-btn" className="button" type="submit" onClick={login}>{t.signUp}</button>
				</section>
			</main>

			<style jsx>{`
				body {
					position: relative;
				}
				h1 {
					margin-block: 1rem;
					text-align: center;
				}

				section {
					padding-top: 5rem;
					display: flex;
					flex-direction: column;
					max-height: calc(100vh - 4rem);
					gap: 1rem;
				}

				.button {
					margin: auto;
				}
				label {
					cursor: pointer;
				}
				.content {
					border: 1px solid var(--color-gray-900);
					padding: 1.5rem;
					height: 0;
					overflow-y: auto;
					flex: 1;
				}
			`}</style>
		</>
	);
}
