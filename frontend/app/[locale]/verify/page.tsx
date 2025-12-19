"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { smsVerificationAPI } from "@/lib/api/endpoints";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft, ArrowRight, Check, MessageSquare, MessageSquareMore } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function VerifyPage() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const redirectUrl = searchParams.get("redirect") || `/${locale}/`;

	const [step, setStep] = useState<"phone" | "verify">("phone");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [sendingCode, setSendingCode] = useState(false);
	const [error, setError] = useState("");
	const [countdown, setCountdown] = useState(0);
	const [isVerified, setIsVerified] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

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
		description: {
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

	function formatPhoneNumber(value: string) {
		const digits = value.replace(/\D/g, "");

		if (digits.startsWith("09")) {
			if (digits.length <= 4) return digits;
			if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
			return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
		}

		return value;
	}

	function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
		const input = e.target.value;
		const formatted = formatPhoneNumber(input);
		setPhoneNumber(formatted);
		setError("");
	}

	function isValidPhone(phone: string) {
		const digits = phone.replace(/\D/g, "");
		return (digits.startsWith("09") && digits.length === 10) || (digits.startsWith("886") && digits.length === 12);
	}

	async function handleSendCode() {
		setError("");

		if (!isValidPhone(phoneNumber)) {
			setError(t.invalidPhoneNumber);
			return;
		}

		if (!turnstileToken) {
			setError("請完成驗證");
			return;
		}

		setSendingCode(true);

		try {
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.send({
				phoneNumber: formattedApiPhone,
				locale,
				turnstileToken
			});

			setCountdown(60);
			setStep("verify");
			setTurnstileToken(null);
		} catch (err) {
			const error = err as Error;
			console.error("Failed to send SMS:", error);
			setError(error.message || "Failed to send verification code");
			setTurnstileToken(null);
		} finally {
			setSendingCode(false);
		}
	}

	function handleCodeChange(index: number, value: string) {
		if (!/^\d*$/.test(value)) return;

		const newCode = [...verificationCode];
		newCode[index] = value.slice(-1);
		setVerificationCode(newCode);
		setError("");

		if (value && index < 5) {
			codeInputRefs.current[index + 1]?.focus();
		}

		if (newCode.every(digit => digit !== "") && newCode.join("").length === 6) {
			verifyCode(newCode.join(""));
		}
	}

	function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
			codeInputRefs.current[index - 1]?.focus();
		} else if (e.key === "Enter" && verificationCode.every(digit => digit !== "")) {
			verifyCode(verificationCode.join(""));
		}
	}

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
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
	}

	async function verifyCode(codeStr: string) {
		setLoading(true);
		setError("");

		if (!codeStr.match(/^\d{6}$/)) {
			setError(t.invalidCode);
			setLoading(false);
			return;
		}

		try {
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.verify({
				phoneNumber: formattedApiPhone,
				code: codeStr
			});

			setIsVerified(true);

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
	}

	async function handleResend() {
		setSendingCode(true);
		setError("");

		if (!turnstileToken) {
			setError("請完成驗證");
			setSendingCode(false);
			setStep("phone");
			return;
		}

		try {
			const rawPhone = phoneNumber.replace(/\D/g, "");
			const apiPhone = rawPhone.startsWith("886") ? rawPhone.slice(3) : rawPhone;
			const formattedApiPhone = apiPhone.startsWith("0") ? apiPhone : `0${apiPhone}`;

			await smsVerificationAPI.send({
				phoneNumber: formattedApiPhone,
				locale,
				turnstileToken
			});

			setCountdown(60);
			setVerificationCode(["", "", "", "", "", ""]);
			codeInputRefs.current[0]?.focus();
			setTurnstileToken(null);
		} catch (err) {
			const error = err as Error;
			console.error("Failed to resend SMS:", error);
			setError(error.message || "Failed to resend verification code");
			setTurnstileToken(null);
		} finally {
			setSendingCode(false);
		}
	}

	function handleBack() {
		setStep("phone");
		setVerificationCode(["", "", "", "", "", ""]);
		setError("");
		setTurnstileToken(null);
	}

	const handleContinue = () => {
		router.push(redirectUrl);
	};

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [redirectUrl, router, countdown]);

	return (
		<>
			<div className="flex items-center justify-center p-4 h-screen">
				<div className="w-full max-w-md">
					<div className="p-8">
						{step === "phone" && !isVerified && (
							<>
								<div className="text-center mb-8">
									<div className="inline-flex items-center justify-center mb-6">
										<MessageSquare size={32} />
									</div>
									<h2 className="text-2xl font-bold text-white mb-2">{t.title}</h2>
									<p className="text-gray-400 text-sm">{t.description}</p>
								</div>

								<div className="mb-6">
									<label className="block text-gray-300 text-sm font-medium mb-2">{t.phoneNumberLabel}</label>
									<input
										type="tel"
										value={phoneNumber}
										onChange={handlePhoneChange}
										placeholder="09XX-XXX-XXX"
										className={`w-full bg-gray-700/50 border-2 rounded-md text-white text-lg p-3
											transition-all duration-200 outline-none
											${error ? "border-red-500" : "border-gray-600"}
											focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20
											placeholder-gray-500`}
										autoFocus
										onKeyDown={e => e.key === "Enter" && handleSendCode()}
									/>
									{error && <p className="text-red-400 text-sm mt-2">{error}</p>}
								</div>

								<div className="flex justify-center mb-6">
									<Turnstile
										siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
										onSuccess={token => setTurnstileToken(token)}
										onError={() => setTurnstileToken(null)}
										onExpire={() => setTurnstileToken(null)}
										options={{
											action: "sms-verification",
											theme: "dark",
											size: "normal"
										}}
									/>
								</div>

								<div className="flex justify-center">
									<Button onClick={handleSendCode} disabled={sendingCode || !phoneNumber || !turnstileToken} size="lg" className="group relative overflow-hidden">
										<div className="svg-wrapper-1">
											<div className="svg-wrapper group-hover:animate-[fly-1_0.8s_ease-in-out_infinite_alternate]">
												{sendingCode ? (
													<Spinner size="sm" />
												) : (
													<svg
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 24 24"
														width={24}
														height={24}
														className="block origin-center transition-transform duration-300 ease-in-out group-hover:translate-x-14 group-hover:rotate-45 group-hover:scale-110"
													>
														<path fill="none" d="M0 0h24v24H0z" />
														<path
															fill="currentColor"
															d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
														/>
													</svg>
												)}
											</div>
										</div>
										<span className="block ml-1.5 transition-transform duration-300 ease-in-out group-hover:translate-x-36">{sendingCode ? t.sendingCode : t.sendCode}</span>
									</Button>
								</div>
							</>
						)}
						{step === "verify" && !isVerified && (
							<>
								<div className="text-center mb-8">
									<div className="inline-flex items-center justify-center mb-6">
										<MessageSquareMore size={32} />
									</div>
									<h2 className="text-2xl font-bold text-white mb-2">{t.codeLabel}</h2>
									<p className="text-gray-400 text-sm">
										{t.codeSent} <span className="text-white font-medium">{phoneNumber}</span>
									</p>
								</div>

								<div className="mb-6">
									<div className="flex justify-center gap-3 mb-2">
										{verificationCode.map((digit, index) => (
											<input
												key={index}
												ref={el => {
													codeInputRefs.current[index] = el;
												}}
												type="text"
												inputMode="numeric"
												maxLength={1}
												value={digit}
												onChange={e => handleCodeChange(index, e.target.value)}
												onKeyDown={e => handleCodeKeyDown(index, e)}
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

									{error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}

									{loading && (
										<div className="flex items-center justify-center gap-2 mt-4">
											<Spinner size="sm" className="mr-1" />
											<span className="text-gray-400 text-sm">{t.verifying}</span>
										</div>
									)}
								</div>

								<div className="text-center mb-4">
									<p className="text-gray-400 text-sm mb-2">{t.didntReceiveCode}</p>
									{countdown > 0 ? (
										<p className="text-gray-500 text-sm">
											{t.resendIn}{" "}
											<span className="text-blue-400 font-medium">
												{countdown}
												{t.resendSeconds}
											</span>
										</p>
									) : (
										<Button variant="link" onClick={handleResend} disabled={sendingCode} className="text-blue-400 hover:text-blue-300 underline h-auto p-0">
											{sendingCode ? "Sending..." : t.resendCode}
										</Button>
									)}
								</div>

								<Button variant="ghost" onClick={handleBack} className="w-full text-gray-400 hover:text-white">
									<ArrowLeft size={16} />
									{t.changePhoneNumber}
								</Button>
							</>
						)}{" "}
						{isVerified && (
							<div className="text-center py-4">
								<div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full animate-scale mb-4">
									<Check className="w-10 h-10 text-green-400" />
								</div>
								<h2 className="text-2xl font-bold text-white mb-2">{t.verified}</h2>
								<p className="text-gray-400 text-sm mb-6">{t.verificationSuccess}</p>
								<Button onClick={handleContinue} className="w-full">
									{t.continue}
									<ArrowRight className="w-5 h-5" />
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

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
