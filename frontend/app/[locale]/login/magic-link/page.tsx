"use client";
import Spinner from "@/components/Spinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function MagicLinkVerify() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const searchParams = useSearchParams();
	const router = useRouter();
	const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
	const [errorMessage, setErrorMessage] = useState("");

	const t = getTranslations(locale, {
		verifying: {
			"zh-Hant": "正在驗證登入連結...",
			"zh-Hans": "正在验证登录链接...",
			en: "Verifying your login link..."
		},
		success: {
			"zh-Hant": "登入成功！",
			"zh-Hans": "登录成功！",
			en: "Login successful!"
		},
		redirecting: {
			"zh-Hant": "正在重新導向...",
			"zh-Hans": "正在重定向...",
			en: "Redirecting..."
		},
		error: {
			"zh-Hant": "登入失敗",
			"zh-Hans": "登录失败",
			en: "Login failed"
		},
		errorInvalidLink: {
			"zh-Hant": "此連結無效或已過期。請重新請求登入連結。",
			"zh-Hans": "此链接无效或已过期。请重新请求登录链接。",
			en: "This link is invalid or has expired. Please request a new login link."
		},
		backToLogin: {
			"zh-Hant": "返回登入頁面",
			"zh-Hans": "返回登录页面",
			en: "Back to Login"
		}
	});

	useEffect(() => {
		// Check if we were redirected back with a status
		const status = searchParams.get("status");

		if (status === "success") {
			setStatus("success");
			showAlert(t.success, "success"); // BEGIN: Show success alert
			// Redirect to home page after 1.5 seconds
			setTimeout(() => {
				router.push(`/${locale}/`);
			}, 1500);
		} else if (status === "error") {
			setStatus("error");
			setErrorMessage(t.errorInvalidLink);
			showAlert(t.errorInvalidLink, "error"); // BEGIN: Show error alert
		} else {
			// No status means user hasn't clicked the magic link yet
			setStatus("error");
			setErrorMessage(t.errorInvalidLink);
			showAlert(t.errorInvalidLink, "error"); // BEGIN: Show error alert
		}
	}, [searchParams, router, locale, t.errorInvalidLink, showAlert]); // END:

	return (
		<>
			<main>
				<section>
					<div
						style={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							textAlign: "center",
							maxWidth: "500px",
							padding: "2rem"
						}}
					>
						{status === "verifying" && (
							<>
								<div style={{ marginBottom: "1.5rem" }}>
									<Spinner size="lg" />
								</div>
								<h1 style={{ marginBottom: "0.5rem" }}>{t.verifying}</h1>
								<p style={{ color: "var(--color-gray-700)" }}>{t.redirecting}</p>
							</>
						)}

						{status === "success" && (
							<>
								<div
									style={{
										fontSize: "3rem",
										marginBottom: "1rem",
										color: "var(--color-primary)"
									}}
								>
									✓
								</div>
								<h1
									style={{
										marginBottom: "0.5rem",
										color: "var(--color-primary)"
									}}
								>
									{t.success}
								</h1>
								<p style={{ color: "var(--color-gray-700)" }}>{t.redirecting}</p>
							</>
						)}

						{status === "error" && (
							<>
								<div
									style={{
										fontSize: "3rem",
										marginBottom: "1rem",
										color: "var(--color-error, #dc2626)"
									}}
								>
									✗
								</div>
								<h1
									style={{
										marginBottom: "1rem",
										color: "var(--color-error, #dc2626)"
									}}
								>
									{t.error}
								</h1>
								<p
									style={{
										marginBottom: "2rem",
										color: "var(--color-gray-700)"
									}}
								>
									{errorMessage}
								</p>
								<button
									className="button"
									onClick={() => router.push(`/${locale}/login`)}
									style={{
										margin: "0 auto"
									}}
								>
									{t.backToLogin}
								</button>
							</>
						)}
					</div>
				</section>
			</main>
		</>
	);
}
