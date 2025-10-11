"use client";

import Nav from "@/components/Nav";
import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { smsVerificationAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [sendingCode, setSendingCode] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [countdown, setCountdown] = useState(0);

	// Get parameters from URL
	const purpose = (searchParams.get("purpose") as "ticket_access" | "phone_verification") || "phone_verification";
	const ticketId = searchParams.get("ticketId") || undefined;
	const redirectUrl = searchParams.get("redirect") || `/${locale}/`;

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "手機驗證",
			"zh-Hans": "手机验证",
			en: "Phone Verification"
		},
		phoneNumberLabel: {
			"zh-Hant": "手機號碼",
			"zh-Hans": "手机号码",
			en: "Phone Number"
		},
		phoneNumberPlaceholder: {
			"zh-Hant": "請輸入手機號碼（09xxxxxxxx）",
			"zh-Hans": "请输入手机号码（09xxxxxxxx）",
			en: "Enter phone number (09xxxxxxxx)"
		},
		sendCode: {
			"zh-Hant": "發送驗證碼",
			"zh-Hans": "发送验证码",
			en: "Send Code"
		},
		resendCode: {
			"zh-Hant": "重新發送",
			"zh-Hans": "重新发送",
			en: "Resend"
		},
		codeLabel: {
			"zh-Hant": "驗證碼",
			"zh-Hans": "验证码",
			en: "Verification Code"
		},
		codePlaceholder: {
			"zh-Hant": "請輸入 6 位數驗證碼",
			"zh-Hans": "请输入 6 位数验证码",
			en: "Enter 6-digit code"
		},
		verify: {
			"zh-Hant": "驗證",
			"zh-Hans": "验证",
			en: "Verify"
		},
		verifying: {
			"zh-Hant": "驗證中...",
			"zh-Hans": "验证中...",
			en: "Verifying..."
		},
		invalidPhoneNumber: {
			"zh-Hant": "無效的手機號碼格式",
			"zh-Hans": "无效的手机号码格式",
			en: "Invalid phone number format"
		},
		codeSent: {
			"zh-Hant": "驗證碼已發送至您的手機",
			"zh-Hans": "验证码已发送至您的手机",
			en: "Verification code sent to your phone"
		},
		verificationSuccess: {
			"zh-Hant": "驗證成功！正在重新導向...",
			"zh-Hans": "验证成功！正在重定向...",
			en: "Verification successful! Redirecting..."
		},
		ticketAccessTitle: {
			"zh-Hant": "票券驗證",
			"zh-Hans": "票券验证",
			en: "Ticket Verification"
		},
		ticketAccessDescription: {
			"zh-Hant": "此票券需要手機驗證才能存取",
			"zh-Hans": "此票券需要手机验证才能访问",
			en: "This ticket requires phone verification to access"
		},
		phoneVerificationDescription: {
			"zh-Hant": "請驗證您的手機號碼",
			"zh-Hans": "请验证您的手机号码",
			en: "Please verify your phone number"
		},
		waitSeconds: {
			"zh-Hant": "秒後可重新發送",
			"zh-Hans": "秒后可重新发送",
			en: "seconds until resend"
		}
	});

	// Check if already verified (for ticket access)
	useEffect(() => {
		if (purpose === "ticket_access" && ticketId) {
			smsVerificationAPI
				.check(ticketId)
				.then(response => {
					if (response.data.isVerified) {
						// Already verified, redirect
						router.push(redirectUrl);
					}
					if (response.data.phoneNumber) {
						setPhoneNumber(response.data.phoneNumber);
					}
				})
				.catch(err => {
					console.error("Failed to check verification status:", err);
				});
		}
	}, [purpose, ticketId, redirectUrl, router]);

	// Countdown timer
	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	const handleSendCode = async () => {
		setError("");
		setSuccess("");

		// Validate phone number
		if (!phoneNumber.match(/^09\d{8}$/)) {
			setError(t.invalidPhoneNumber);
			return;
		}

		setSendingCode(true);

		try {
			await smsVerificationAPI.send({
				phoneNumber,
				purpose,
				ticketId,
				locale
			});

			setSuccess(t.codeSent);
			setCountdown(60); // 60 seconds cooldown
		} catch (err: any) {
			console.error("Failed to send SMS:", err);
			setError(err?.response?.data?.message || "Failed to send verification code");
		} finally {
			setSendingCode(false);
		}
	};

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		if (!verificationCode.match(/^\d{6}$/)) {
			setError("驗證碼必須為 6 位數字");
			return;
		}

		setLoading(true);

		try {
			await smsVerificationAPI.verify({
				phoneNumber,
				code: verificationCode,
				purpose,
				ticketId
			});

			setSuccess(t.verificationSuccess);

			// Redirect after successful verification
			setTimeout(() => {
				router.push(redirectUrl);
			}, 1500);
		} catch (err: any) {
			console.error("Verification failed:", err);
			setError(err?.response?.data?.message || "Verification failed");
			setLoading(false);
		}
	};

	return (
		<>
			<Nav />
			<main>
				<section style={{ padding: "2rem 1rem", maxWidth: "500px", margin: "0 auto" }}>
					<div style={{ textAlign: "center", marginBottom: "2rem" }}>
						<h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>{purpose === "ticket_access" ? t.ticketAccessTitle : t.title}</h1>
						<p style={{ color: "var(--color-gray-700)" }}>{purpose === "ticket_access" ? t.ticketAccessDescription : t.phoneVerificationDescription}</p>
					</div>

					<form onSubmit={handleVerify}>
						<div style={{ marginBottom: "1.5rem" }}>
							<label htmlFor="phoneNumber" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
								{t.phoneNumberLabel}
							</label>
							<div style={{ display: "flex", gap: "0.5rem" }}>
								<input type="tel" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder={t.phoneNumberPlaceholder} style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--color-gray-300)", borderRadius: "0.25rem" }} maxLength={10} disabled={countdown > 0 || loading} />
								<button type="button" onClick={handleSendCode} disabled={sendingCode || countdown > 0 || loading} className="button" style={{ whiteSpace: "nowrap", minWidth: "120px" }}>
									{sendingCode ? <Spinner size="sm" /> : countdown > 0 ? `${countdown}${t.waitSeconds}` : success ? t.resendCode : t.sendCode}
								</button>
							</div>
						</div>

						<div style={{ marginBottom: "1.5rem" }}>
							<label htmlFor="code" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
								{t.codeLabel}
							</label>
							<input type="text" id="code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder={t.codePlaceholder} style={{ width: "100%", padding: "0.5rem", border: "1px solid var(--color-gray-300)", borderRadius: "0.25rem" }} maxLength={6} disabled={loading} />
						</div>

						{error && (
							<div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "var(--color-error-bg, #fee)", color: "var(--color-error, #c00)", borderRadius: "0.25rem", border: "1px solid var(--color-error, #c00)" }}>
								{error}
							</div>
						)}

						{success && (
							<div style={{ padding: "0.75rem", marginBottom: "1rem", backgroundColor: "var(--color-success-bg, #efe)", color: "var(--color-success, #0a0)", borderRadius: "0.25rem", border: "1px solid var(--color-success, #0a0)" }}>
								{success}
							</div>
						)}

						<button type="submit" disabled={loading || !verificationCode || !phoneNumber} className="button" style={{ width: "100%" }}>
							{loading ? (
								<>
									<Spinner size="sm" /> {t.verifying}
								</>
							) : (
								t.verify
							)}
						</button>
					</form>
				</section>
			</main>
		</>
	);
}
