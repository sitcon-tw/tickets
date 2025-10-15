"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { ApiError } from "@/lib/types/api";
import { smsVerificationAPI } from "@/lib/api/endpoints";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Check, ArrowRight, ArrowLeft, MessageSquare, MessageSquareMore } from "lucide-react";

export default function VerifyPage() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [step, setStep] = useState<"phone" | "verify">("phone");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [sendingCode, setSendingCode] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [countdown, setCountdown] = useState(0);
	const [isVerified, setIsVerified] = useState(false);

	// Refs for code inputs
	const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Get parameters from URL
	const purpose = (searchParams.get("purpose") as "ticket_access" | "phone_verification") || "phone_verification";
	const ticketId = searchParams.get("ticketId") || undefined;
	const redirectUrl = searchParams.get("redirect") || `/${locale}/`;

	const t = getTranslations(locale, {
		title: {
			"zh-Hant": "簡訊驗證",
			"zh-Hans": "短信验证",
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
		verified: {
			"zh-Hant": "已驗證",
			"zh-Hans": "已验证",
			en: "Verified"
		},
		verifying: {
			"zh-Hant": "驗證中...",
			"zh-Hans": "验证中...",
			en: "Verifying..."
		},
		verifyFail: {
			"zh-Hant": "驗證失敗，請重試",
			"zh-Hans": "验证失败，请重试",
			en: "Verification failed, please try again"
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
		},
		invalidCode: {
			"zh-Hant": "驗證碼必須為 6 位數字",
			"zh-Hans": "验证码必须为 6 位数字",
			en: "Verification code must be 6 digits"
		},
		didntReceiveCode: {
			"zh-Hant": "沒有收到驗證碼？",
			"zh-Hans": "没有收到验证码？",
			en: "Didn't receive the code?"
		},
		resendIn: {
			"zh-Hant": "在",
			"zh-Hans": "在",
			en: "Resend in"
		},
		resendSeconds: {
			"zh-Hant": "秒後重新發送...",
			"zh-Hans": "秒后重新发送...",
			en: "s"
		},
		changePhoneNumber: {
			"zh-Hant": "更換手機號碼",
			"zh-Hans": "更换手机号码",
			en: "Change phone number"
		},
		sendingCode: {
			"zh-Hant": "發送中...",
			"zh-Hans": "发送中...",
			en: "Sending..."
		},
		continue: {
			"zh-Hant": "繼續",
			"zh-Hans": "继续",
			en: "Continue"
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
				.catch((err: ApiError) => {
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

	const formatPhoneNumber = (value: string) => {
		const digits = value.replace(/\D/g, "");

		if (digits.startsWith("09")) {
			if (digits.length <= 4) return digits;
			if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
			return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
		}

		return value;
	};

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const input = e.target.value;
		const formatted = formatPhoneNumber(input);
		setPhoneNumber(formatted);
		setError("");
	};

	const isValidPhone = (phone: string) => {
		const digits = phone.replace(/\D/g, "");
		return (digits.startsWith("09") && digits.length === 10) ||
			   (digits.startsWith("886") && digits.length === 12);
	};

	const handleSendCode = async () => {
		setError("");
		setSuccess("");

		// Validate phone number using the new validation function
		if (!isValidPhone(phoneNumber)) {
			setError(t.invalidPhoneNumber);
			return;
		}

		setSendingCode(true);

		try {
			// Extract raw phone number for API
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.send({
				phoneNumber: formattedApiPhone,
				purpose,
				ticketId,
				locale
			});

			setSuccess(t.codeSent);
			setCountdown(60); // 60 seconds cooldown
			setStep("verify"); // Move to verification step
		} catch (err) {
			const error = err as Error;
			console.error("Failed to send SMS:", error);
			setError(error.message || "Failed to send verification code");
		} finally {
			setSendingCode(false);
		}
	};

	const handleCodeChange = (index: number, value: string) => {
		// Only allow digits
		if (!/^\d*$/.test(value)) return;

		const newCode = [...verificationCode];
		newCode[index] = value.slice(-1); // Only take the last character
		setVerificationCode(newCode);
		setError("");

		// Auto-focus next input
		if (value && index < 5) {
			codeInputRefs.current[index + 1]?.focus();
		}

		// Auto-verify when all digits are entered
		if (newCode.every(digit => digit !== "") && newCode.join("").length === 6) {
			verifyCode(newCode.join(""));
		}
	};

	const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		// Handle backspace
		if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
			codeInputRefs.current[index - 1]?.focus();
		} else if (e.key === "Enter" && verificationCode.every(digit => digit !== "")) {
			verifyCode(verificationCode.join(""));
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").slice(0, 6);
		if (!/^\d+$/.test(pastedData)) return;

		const newCode = [...verificationCode];
		pastedData.split("").forEach((char, i) => {
			if (i < 6) newCode[i] = char;
		});
		setVerificationCode(newCode);

		const nextEmpty = newCode.findIndex(digit => digit === "");
		if (nextEmpty !== -1) {
			codeInputRefs.current[nextEmpty]?.focus();
		} else {
			codeInputRefs.current[5]?.focus();
			verifyCode(newCode.join(""));
		}
	};

	const verifyCode = async (codeStr: string) => {
		setLoading(true);
		setError("");
		setSuccess("");

		if (!codeStr.match(/^\d{6}$/)) {
			setError(t.invalidCode);
			setLoading(false);
			return;
		}

		try {
			// Extract raw phone number for API
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.verify({
				phoneNumber: formattedApiPhone,
				code: codeStr,
				purpose,
				ticketId
			});

			setSuccess(t.verificationSuccess);
			setIsVerified(true);

			// Redirect after successful verification
			setTimeout(() => {
				router.push(redirectUrl);
			}, 2000);
		} catch (err) {
			const error = err as Error;
			console.error("Verification failed:", error);
			setError(error.message || t.verifyFail);
			setVerificationCode(["", "", "", "", "", ""]);
			codeInputRefs.current[0]?.focus();
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		setSendingCode(true);
		setError("");
		setSuccess("");

		try {
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.send({
				phoneNumber: formattedApiPhone,
				purpose,
				ticketId,
				locale
			});

			setCountdown(60);
			setVerificationCode(["", "", "", "", "", ""]);
			codeInputRefs.current[0]?.focus();
		} catch (err) {
			const error = err as Error;
			console.error("Failed to resend SMS:", error);
			setError(error.message || "Failed to resend verification code");
		} finally {
			setSendingCode(false);
		}
	};

	const handleBack = () => {
		setStep("phone");
		setVerificationCode(["", "", "", "", "", ""]);
		setError("");
		setSuccess("");
	};

	const handleContinue = () => {
		router.push(redirectUrl);
	};

	const isCodeComplete = verificationCode.every(digit => digit !== "");

	return (
		<>
			<Nav />
			<div className="min-h-screen flex items-center justify-center" style={{ padding: "1rem" }}>
				<div className="w-full max-w-md">
					<div style={{ padding: "2rem" }}>
						{step === "phone" && !isVerified && (
							<>
								<div className="text-center" style={{ marginBottom: "2rem" }}>
									<div className="inline-flex items-center justify-center" style={{ marginBottom: "1.5rem" }}>
										<MessageSquare size={32} />
									</div>
									<h2 className="text-2xl font-bold text-white" style={{ marginBottom: "0.5rem" }}>
										{purpose === "ticket_access" ? t.ticketAccessTitle : t.title}
									</h2>
									<p className="text-gray-400 text-sm">
										{purpose === "ticket_access" ? t.ticketAccessDescription : t.phoneVerificationDescription}
									</p>
								</div>

								<div style={{ marginBottom: "1.5rem" }}>
									<label className="block text-gray-300 text-sm font-medium" style={{ marginBottom: "0.5rem" }}>
										{t.phoneNumberLabel}
									</label>
									<input
										type="tel"
										value={phoneNumber}
										onChange={handlePhoneChange}
										placeholder="09XX-XXX-XXX"
										className={`w-full bg-gray-700/50 border-2 rounded-md text-white text-lg
											transition-all duration-200 outline-none
											${error ? "border-red-500" : "border-gray-600"}
											focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20
											placeholder-gray-500`}
										style={{ padding: "0.75rem 1rem" }}
										autoFocus
										onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
									/>
									{error && (
										<p className="text-red-400 text-sm" style={{ marginTop: "0.5rem" }}>{error}</p>
									)}
								</div>

								<div className="flex justify-center">
									<div className={`send-button-container ${sendingCode || !phoneNumber ? 'disabled' : ''}`}>
										<button
											onClick={handleSendCode}
											disabled={sendingCode || !phoneNumber}
										>
											<div className="svg-wrapper-1">
												<div className="svg-wrapper">
													{sendingCode ? (
														<Spinner size="sm" />
													) : (
														<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24}>
															<path fill="none" d="M0 0h24v24H0z" />
															<path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
														</svg>
													)}
												</div>
											</div>
											<span>{sendingCode ? t.sendingCode : t.sendCode}</span>
										</button>
									</div>
								</div>
							</>
						)}

						{step === "verify" && !isVerified && (
							<>
								<div className="text-center" style={{ marginBottom: "2rem" }}>
									<div className="inline-flex items-center justify-center" style={{ marginBottom: "1.5rem" }}>
										<MessageSquareMore size={32} />
									</div>
									<h2 className="text-2xl font-bold text-white" style={{ marginBottom: "0.5rem" }}>{t.codeLabel}</h2>
									<p className="text-gray-400 text-sm">
										{t.codeSent} <span className="text-white font-medium">{phoneNumber}</span>
									</p>
								</div>

								<div style={{ marginBottom: "1.5rem" }}>
									<div className="flex justify-center" style={{ gap: "0.75rem", marginBottom: "0.5rem" }}>
										{verificationCode.map((digit, index) => (
											<input
												key={index}
												ref={el => { codeInputRefs.current[index] = el; }}
												type="text"
												inputMode="numeric"
												maxLength={1}
												value={digit}
												onChange={(e) => handleCodeChange(index, e.target.value)}
												onKeyDown={(e) => handleCodeKeyDown(index, e)}
												onPaste={handlePaste}
												disabled={loading}
												className={`w-12 h-14 text-center text-2xl font-semibold bg-gray-700/50 border-2 rounded-md
													transition-all duration-200 outline-none
													${digit ? "border-gray-200 text-white" : "border-gray-600 text-gray-400"}
													${error ? "border-red-500 shake" : ""}
													${loading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-500"}
													focus:border-gray-200 focus:ring-2 focus:ring-gray-200/20`}
												autoFocus={index === 0}
											/>
										))}
									</div>

									{error && (
										<p className="text-red-400 text-sm text-center" style={{ marginTop: "0.75rem" }}>
											{error}
										</p>
									)}

									{loading && (
										<div className="flex items-center justify-center" style={{ gap: "0.5rem", marginTop: "1rem" }}>
											<Spinner size="sm" style={{ marginRight: "4px" }} />
											<span className="text-gray-400 text-sm">{t.verifying}</span>
										</div>
									)}
								</div>

								<div className="text-center" style={{ marginBottom: "1rem" }}>
									<p className="text-gray-400 text-sm" style={{ marginBottom: "0.5rem" }}>{t.didntReceiveCode}</p>
									{countdown > 0 ? (
										<p className="text-gray-500 text-sm">
											{t.resendIn} <span className="text-blue-400 font-medium">{countdown}{t.resendSeconds}</span>
										</p>
									) : (
										<button
											onClick={handleResend}
											disabled={sendingCode}
											className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors underline cursor-pointer disabled:opacity-50"
										>
											{sendingCode ? "Sending..." : t.resendCode}
										</button>
									)}
								</div>

								<button
									onClick={handleBack}
									className="w-full text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center cursor-pointer"
								>
									<ArrowLeft size={16} style={{ marginRight: "0.5rem" }} />{t.changePhoneNumber}
								</button>
							</>
						)}

						{isVerified && (
							<div className="text-center" style={{ padding: "1rem 0" }}>
								<div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full animate-scale" style={{ marginBottom: "1rem" }}>
									<Check className="w-10 h-10 text-green-400" />
								</div>
								<h2 className="text-2xl font-bold text-white" style={{ marginBottom: "0.5rem" }}>{t.verified}</h2>
								<p className="text-gray-400 text-sm" style={{ marginBottom: "1.5rem" }}>
									{t.verificationSuccess}
								</p>
								<button
									onClick={handleContinue}
									className="w-full text-white font-medium rounded-md transition-all duration-200 flex items-center justify-center"
									style={{ padding: "0.75rem 1.5rem", gap: "0.5rem" }}
								>
									{t.continue}
									<ArrowRight className="w-5 h-5" />
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			<Footer />

			<style>{`
				@keyframes shake {
					0%, 100% { transform: translateX(0); }
					25% { transform: translateX(-5px); }
					75% { transform: translateX(5px); }
				}

				@keyframes scale {
					0% { transform: scale(0); }
					50% { transform: scale(1.1); }
					100% { transform: scale(1); }
				}

				@keyframes fly-1 {
					from {
						transform: translateY(0.1em);
					}
					to {
						transform: translateY(-0.1em);
					}
				}

				.shake {
					animation: shake 0.3s ease-in-out;
				}

				.animate-scale {
					animation: scale 0.5s ease-out;
				}

				.send-button-container button {
					font-family: inherit;
					font-size: 18px;
					background: var(--color-gray-800);
					color: white;
					padding: 0.6em 1em;
					display: flex;
					align-items: center;
					border: var(--color-gray-600) 2px solid;
					border-radius: 8px;
					overflow: hidden;
					transition: all 0.2s;
					cursor: pointer;
					margin: 1rem auto;
				}

				.send-button-container.disabled button {
					cursor: not-allowed;
					opacity: 0.7;
				}

				.send-button-container button span {
					display: block;
					margin-left: 0.3em;
					transition: all 0.3s ease-in-out;
				}

				.send-button-container button svg {
					display: block;
					transform-origin: center center;
					transition: transform 0.3s ease-in-out;
				}

				.send-button-container:not(.disabled) button:hover .svg-wrapper {
					animation: fly-1 0.8s ease-in-out infinite alternate;
				}

				.send-button-container:not(.disabled) button:hover svg {
					transform: translateX(2.4em) rotate(45deg) scale(1.1);
				}

				.send-button-container:not(.disabled) button:hover span {
					transform: translateX(9em);
				}

				.send-button-container:not(.disabled) button:active {
					transform: scale(0.95);
				}
			`}</style>
		</>
	);
}
