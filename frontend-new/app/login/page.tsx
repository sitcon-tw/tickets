---
import Layout from "@layouts/Layout.astro";
import * as i18n from "src/i18n";
import Nav from "@components/Nav.astro";
const lang = i18n.local(Astro.url.pathname);
const t = i18n.t(lang, {
	login: {
		"zh-Hant": "登入／註冊",
		"zh-Hans": "登录／注册",
		en: "Login / Register"
	},
	continue: {
		"zh-Hant": "寄送 Magic Link",
		"zh-Hans": "发送 Magic Link",
		en: "Send Magic Link"
	},
	sent: {
		"zh-Hant": "已發送 Magic Link",
		"zh-Hans": "已发送 Magic Link",
		en: "Magic Link Sent"
	},
	retry: {
		"zh-Hant": "重試",
		"zh-Hans": "重试",
		en: "Retry"
	},
	message: {
		"zh-Hant": "請檢查您的電子郵件收件匣，並點擊連結以登入。若在垃圾郵件請記得回報為非垃圾郵件，以免錯過後續重要信件。",
		"zh-Hans": "请检查您的电子邮件收件箱，并点击链接以登录。若在垃圾邮件请记得举报为非垃圾邮件，以免错过后续重要信件。",
		en: "Please check your email inbox and click the link to log in. If you find it in the spam folder, please mark it as not spam to avoid missing important future emails."
	},
	error: {
		"zh-Hant": "錯誤",
		"zh-Hans": "错误",
		en: "Error"
	}
});
const l = i18n.l(Astro.url);
---

<Layout i18n={t.t} path="login" title={t.login} theme="#FFF" lang={lang}>
	<Nav />
	<main>
		<section class="login">
			<div class="login-container" id="magic-link-form">
				<h1>{t.login}</h1>
				<label for="email">Email</label>
				<input type="email" name="email" id="email" />
				<button id="submit-btn" class="button" type="submit" onclick="login()">{t.continue}</button>
			</div>
			<div class="sent-container content">
				<h2>{t.sent}</h2>
				<p>{t.message}</p>
				<button class="button" onclick="document.querySelector('section').classList = 'login'">{t.retry}</button>
			</div>
			<div class="error-container">
				<h2>{t.error}</h2>
				<p>{t.errorMessage}</p>
			</div>
		</section>
	</main>

	<style is:inline>
		body {
			position: relative;
		}
		h1 {
			margin-block: 1rem;
			text-align: center;
		}
		label {
			display: block;
			margin-bottom: 0.5rem;
			font-weight: bold;
		}
		input {
			border: 2px solid var(--color-gray-900);
			width: 20rem;
			padding: 0.5rem;
			max-width: 100%;
		}
		section > div {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			max-width: 100%;
			padding: 1rem;
		}

		.login-container {
			/* margin: 2rem auto;
			width: fit-content; */
		}

		section .button {
			margin: 1rem auto;
		}
		section > div {
			opacity: 0;
			pointer-events: none;
		}
		.login > .login-container,
		.sent > .sent-container,
		.error > .error-container {
			opacity: 1;
			pointer-events: all;
		}
	</style>

	<script is:inline>
		const login = async () => {
			const email = document.getElementById("email").value;
			if (!email) return;
			
			try {
				const BACKEND_URI = 'http://localhost:3000';
				const response = await fetch(`${BACKEND_URI}/api/auth/sign-in/magic-link`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						email: email,
						name: email.split("@")[0],
						callbackURL: window.location.origin,
						newUserCallbackURL: window.location.origin,
						errorCallbackURL: `${window.location.origin}/login/`
					})
				});
				
				if (response.ok) {
					document.querySelector("section").classList = "sent";
				} else {
					document.querySelector("section").classList = "error";
				}
			} catch (error) {
				console.error("Login error:", error);
				document.querySelector("section").classList = "error";
			}
		};
	</script>
</Layout>
