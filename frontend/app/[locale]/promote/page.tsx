"use client";

import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { userAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function PromoteToAdmin() {
	const locale = useLocale();
	const router = useRouter();

	const [viewState, setViewState] = useState<"form" | "success" | "error">("form");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "升級為管理員",
			"zh-Hans": "升级为管理员",
			en: "Promote to Admin"
		},
		passwordLabel: {
			"zh-Hant": "管理員密碼",
			"zh-Hans": "管理员密码",
			en: "Admin Password"
		},
		submit: {
			"zh-Hant": "升級",
			"zh-Hans": "升级",
			en: "Promote"
		},
		success: {
			"zh-Hant": "成功升級為管理員",
			"zh-Hans": "成功升级为管理员",
			en: "Successfully Promoted to Admin"
		},
		successMessage: {
			"zh-Hant": "您已成功升級為管理員，正在重新導向到管理後台...",
			"zh-Hans": "您已成功升级为管理员，正在重新导向到管理后台...",
			en: "You have been successfully promoted to admin. Redirecting to admin dashboard..."
		},
		error: {
			"zh-Hant": "錯誤",
			"zh-Hans": "错误",
			en: "Error"
		},
		invalidPassword: {
			"zh-Hant": "密碼錯誤",
			"zh-Hans": "密码错误",
			en: "Invalid Password"
		},
		retry: {
			"zh-Hant": "重試",
			"zh-Hans": "重试",
			en: "Retry"
		},
		description: {
			"zh-Hant": "請輸入管理員密碼以獲得管理員權限",
			"zh-Hans": "请输入管理员密码以获得管理员权限",
			en: "Enter the admin password to gain admin permissions"
		}
	});

	async function handlePromote() {
		const passwordInput = document.getElementById("password") as HTMLInputElement;
		const password = passwordInput?.value;
		if (!password || isLoading) return;

		setIsLoading(true);
		setErrorMessage("");

		try {
			await userAPI.promoteToAdmin(password);
			setViewState("success");

			setTimeout(() => {
				router.push(`/${locale}/admin`);
			}, 2000);
		} catch (error: unknown) {
			console.error("Promote error:", error);
			setErrorMessage("錯誤!!!!!");
			setViewState("error");
		} finally {
			setIsLoading(false);
		}
	};

	const containerStyle: React.CSSProperties = {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		maxWidth: "100%",
		padding: "1rem",
		opacity: 0,
		pointerEvents: "none"
	};

	const activeContainerStyle: React.CSSProperties = {
		...containerStyle,
		opacity: 1,
		pointerEvents: "all"
	};

	return (
		<>
			<main>
				<section>
					<div id="promote-form" style={viewState === "form" ? activeContainerStyle : containerStyle}>
						<h1
							style={{
								marginBlock: "1rem",
								textAlign: "center"
							}}
						>
							{t.title}
						</h1>
						<p
							style={{
								textAlign: "center",
								marginBottom: "1.5rem",
								color: "var(--color-gray-700)"
							}}
						>
							{t.description}
						</p>
						<label
							htmlFor="password"
							style={{
								display: "block",
								marginBottom: "0.5rem",
								fontWeight: "bold"
							}}
						>
							{t.passwordLabel}
						</label>
						<input
							type="password"
							name="password"
							id="password"
							autoComplete="off"
							onKeyDown={e => {
								if (e.key === "Enter") {
									handlePromote();
								}
							}}
							style={{
								border: "2px solid var(--color-gray-900)",
								width: "20rem",
								padding: "0.5rem",
								maxWidth: "100%"
							}}
						/>
						<button
							id="submit-btn"
							className="button"
							type="submit"
							onClick={handlePromote}
							disabled={isLoading}
							style={{
								margin: "1rem auto",
								opacity: isLoading ? 0.7 : 1,
								cursor: isLoading ? "not-allowed" : "pointer",
								transition: "opacity 0.2s",
								display: "flex",
								alignItems: "center",
								gap: "0.5rem"
							}}
						>
							{isLoading && <Spinner size="sm" />}
							{t.submit}
						</button>
					</div>

					<div style={viewState === "success" ? activeContainerStyle : containerStyle}>
						<h2 style={{ textAlign: "center", color: "green" }}>{t.success}</h2>
						<p style={{ textAlign: "center" }}>{t.successMessage}</p>
					</div>

					<div style={viewState === "error" ? activeContainerStyle : containerStyle}>
						<h2 style={{ textAlign: "center", color: "red" }}>{t.error}</h2>
						<p style={{ textAlign: "center", marginBottom: "1rem" }}>{errorMessage || t.invalidPassword}</p>
						<button
							className="button"
							onClick={() => {
								setViewState("form");
								setIsLoading(false);
								setErrorMessage("");
							}}
							style={{
								margin: "1rem auto"
							}}
						>
							{t.retry}
						</button>
					</div>
				</section>
			</main>
		</>
	);
}
