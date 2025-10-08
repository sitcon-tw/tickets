"use client";

import Nav from "@/components/Nav";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";

export default function Terms() {
	const locale = useLocale();
	const t = getTranslations(locale, {
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
				<section
					style={{
						paddingTop: "5rem",
						display: "flex",
						flexDirection: "column",
						maxHeight: "calc(100vh - 4rem)",
						gap: "1rem"
					}}
				>
					<h1
						style={{
							marginBlock: "1rem",
							textAlign: "center"
						}}
					>
						{t.newAccount}
					</h1>
					<div
						style={{
							border: "1px solid var(--color-gray-900)",
							padding: "1.5rem",
							height: "0",
							overflowY: "auto",
							flex: "1"
						}}
					>
						{/* TODO: Import and render TermsContent markdown */}
						<p>Terms content will go here</p>
					</div>
					<div>
						<input type="checkbox" name="" id="checkbox" />
						<label htmlFor="checkbox" style={{ cursor: "pointer" }}>
							{t.agree}
						</label>
					</div>
					<button id="submit-btn" className="button" type="submit" onClick={login} style={{ margin: "auto" }}>
						{t.signUp}
					</button>
				</section>
			</main>
		</>
	);
}
