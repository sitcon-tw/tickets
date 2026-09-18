"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { smsVerificationAPI } from "@/lib/api/endpoints";
import { Turnstile } from "@marsidev/react-turnstile";
import { ArrowLeft, ArrowRight, Check, MessageSquare, MessageSquareMore } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useRef } from "react";

const verificationCodeSlots = [
	{ id: "first", index: 0 },
	{ id: "second", index: 1 },
	{ id: "third", index: 2 },
	{ id: "fourth", index: 3 },
	{ id: "fifth", index: 4 },
	{ id: "sixth", index: 5 }
] as const;

function formatPhoneNumber(value: string) {
	const digits = value.replace(/\D/g, "");

	if (digits.startsWith("09")) {
		if (digits.length <= 4) return digits;
		if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
		return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
	}

	return value;
}

function isValidPhone(phone: string) {
	const digits = phone.replace(/\D/g, "");
	return (digits.startsWith("09") && digits.length === 10) || (digits.startsWith("886") && digits.length === 12);
}

const emptyVerificationCode = ["", "", "", "", "", ""];

type VerifyState = {
	step: "phone" | "verify";
	phoneNumber: string;
	verificationCode: string[];
	loading: boolean;
	sendingCode: boolean;
	error: string;
	countdown: number;
	isVerified: boolean;
	turnstileToken: string | null;
};

type VerifyAction =
	| { type: "phoneChanged"; phoneNumber: string }
	| { type: "turnstileChanged"; token: string | null }
	| { type: "sendStarted" }
	| { type: "sendFailed"; error: string; resetToPhone?: boolean }
	| { type: "sendSucceeded" }
	| { type: "codeChanged"; code: string[] }
	| { type: "verifyStarted" }
	| { type: "invalidCode"; error: string }
	| { type: "verifySucceeded" }
	| { type: "verifyFailed"; error: string }
	| { type: "backToPhone" }
	| { type: "tickCountdown" };

function verifyReducer(state: VerifyState, action: VerifyAction): VerifyState {
	switch (action.type) {
		case "phoneChanged":
			return { ...state, phoneNumber: action.phoneNumber, error: "" };
		case "turnstileChanged":
			return { ...state, turnstileToken: action.token };
		case "sendStarted":
			return { ...state, sendingCode: true, error: "" };
		case "sendFailed":
			return {
				...state,
				sendingCode: false,
				error: action.error,
				turnstileToken: null,
				step: action.resetToPhone ? "phone" : state.step
			};
		case "sendSucceeded":
			return {
				...state,
				step: "verify",
				sendingCode: false,
				countdown: 60,
				verificationCode: [...emptyVerificationCode],
				turnstileToken: null
			};
		case "codeChanged":
			return { ...state, verificationCode: action.code, error: "" };
		case "verifyStarted":
			return { ...state, loading: true, error: "" };
		case "invalidCode":
			return { ...state, loading: false, error: action.error };
		case "verifySucceeded":
			return { ...state, loading: false, isVerified: true };
		case "verifyFailed":
			return { ...state, loading: false, error: action.error, verificationCode: [...emptyVerificationCode] };
		case "backToPhone":
			return { ...state, step: "phone", verificationCode: [...emptyVerificationCode], error: "", turnstileToken: null };
		case "tickCountdown":
			return { ...state, countdown: Math.max(0, state.countdown - 1) };
		default:
			return state;
	}
}

const verifyPageTranslations = {
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
};

type VerifyTranslations = Record<string, string>;

function PhoneStep({
	t,
	phoneNumber,
	error,
	sendingCode,
	turnstileToken,
	onPhoneChange,
	onSendCode,
	dispatchVerify
}: {
	t: VerifyTranslations;
	phoneNumber: string;
	error: string;
	sendingCode: boolean;
	turnstileToken: string | null;
	onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSendCode: () => void;
	dispatchVerify: React.Dispatch<VerifyAction>;
}) {
	return (
		<>
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center mb-6">
					<MessageSquare size={32} />
				</div>
				<h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{t.title}</h2>
				<p className="text-gray-400 text-sm">{t.description}</p>
			</div>

			<div className="justify-center items-center flex flex-col">
				<div className="mb-6">
					<label htmlFor="phone-number" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
						{t.phoneNumberLabel}
					</label>
					<input
						id="phone-number"
						type="tel"
						value={phoneNumber}
						onChange={onPhoneChange}
						placeholder="09XX-XXX-XXX"
						className={`w-xs bg-gray-300/50 dark:bg-gray-700/50 border-2 rounded-md text-gray-700 dark:text-white text-md py-2 px-3
							transition-all duration-200 outline-none
							${error ? "border-red-500" : "border-gray-600"}
							focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20
							placeholder-gray-500`}
						onKeyDown={e => e.key === "Enter" && onSendCode()}
					/>
					{error && <p className="text-red-400 text-sm mt-2">{error}</p>}
				</div>
			</div>

			<div className="flex justify-center mb-6">
				<Turnstile
					siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
					onSuccess={token => dispatchVerify({ type: "turnstileChanged", token })}
					onError={() => dispatchVerify({ type: "turnstileChanged", token: null })}
					onExpire={() => dispatchVerify({ type: "turnstileChanged", token: null })}
					options={{
						action: "sms-verification",
						theme: "dark",
						size: "normal"
					}}
				/>
			</div>

			<div className="flex justify-center">
				<Button onClick={onSendCode} disabled={sendingCode || !phoneNumber || !turnstileToken} size="lg" className="group relative overflow-hidden">
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
									<path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
								</svg>
							)}
						</div>
					</div>
					<span className="block ml-1.5 transition-transform duration-300 ease-in-out group-hover:translate-x-36">{sendingCode ? t.sendingCode : t.sendCode}</span>
				</Button>
			</div>
		</>
	);
}

function VerifiedStep({ t, onContinue }: { t: VerifyTranslations; onContinue: () => void }) {
	return (
		<div className="text-center py-4">
			<div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full animate-scale mb-4">
				<Check className="w-10 h-10 text-green-400" />
			</div>
			<h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.verified}</h2>
			<p className="text-gray-800 dark:text-gray-400 text-sm mb-6">{t.verificationSuccess}</p>
			<Button onClick={onContinue} className="w-full">
				{t.continue}
				<ArrowRight className="w-5 h-5" />
			</Button>
		</div>
	);
}

function CodeStep({
	t,
	phoneNumber,
	verificationCode,
	loading,
	sendingCode,
	error,
	countdown,
	codeInputRefs,
	onCodeChange,
	onCodeKeyDown,
	onPaste,
	onResend,
	onBack
}: {
	t: VerifyTranslations;
	phoneNumber: string;
	verificationCode: string[];
	loading: boolean;
	sendingCode: boolean;
	error: string;
	countdown: number;
	codeInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
	onCodeChange: (index: number, value: string) => void;
	onCodeKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
	onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
	onResend: () => void;
	onBack: () => void;
}) {
	return (
		<>
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center mb-6">
					<MessageSquareMore size={32} />
				</div>
				<h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.codeLabel}</h2>
				<p className="text-gray-700 dark:text-gray-400 text-sm">
					{t.codeSent} <span className="text-gray-800 dark:text-white font-medium">{phoneNumber}</span>
				</p>
			</div>

			<div className="mb-6">
				<div className="flex justify-center gap-3 mb-2">
					{verificationCodeSlots.map(slot => (
						<input
							key={slot.id}
							ref={el => {
								codeInputRefs.current[slot.index] = el;
							}}
							type="text"
							inputMode="numeric"
							maxLength={1}
							aria-label={`${t.codeLabel} ${slot.index + 1}`}
							value={verificationCode[slot.index]}
							onChange={e => onCodeChange(slot.index, e.target.value)}
							onKeyDown={e => onCodeKeyDown(slot.index, e)}
							onPaste={onPaste}
							disabled={loading}
							className={`w-12 h-14 text-center text-2xl font-semibold bg-gray-300/50 dark:bg-gray-700/50 border-2 rounded-md
								transition-all duration-200 outline-none
								${verificationCode[slot.index] ? "border-gray-700 dark:border-gray-200 text-gray-800 dark:text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-400"}
								${error ? "border-red-500 shake" : ""}
								${loading ? "opacity-50 cursor-not-allowed" : "hover:border-gray-200 dark:hover:border-gray-500"}
								focus:border-gray-200 focus:ring-2 focus:ring-gray-200/20`}
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
				<p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{t.didntReceiveCode}</p>
				{countdown > 0 ? (
					<p className="text-gray-500 text-sm">
						{t.resendIn}{" "}
						<span className="text-blue-400 font-medium">
							{countdown}
							{t.resendSeconds}
						</span>
					</p>
				) : (
					<Button variant="link" onClick={onResend} disabled={sendingCode} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline h-auto p-0">
						{sendingCode ? "Sending..." : t.resendCode}
					</Button>
				)}
			</div>

			<Button variant="ghost" onClick={onBack} className="w-full text-gray-700 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
				<ArrowLeft size={16} />
				{t.changePhoneNumber}
			</Button>
		</>
	);
}

function VerifyPageContent() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
	const redirectUrl = searchParams.get("redirect") || `/${locale}/`;

	const [{ step, phoneNumber, verificationCode, loading, sendingCode, error, countdown, isVerified, turnstileToken }, dispatchVerify] = useReducer(verifyReducer, {
		step: "phone",
		phoneNumber: "",
		verificationCode: [...emptyVerificationCode],
		loading: false,
		sendingCode: false,
		error: "",
		countdown: 0,
		isVerified: false,
		turnstileToken: null
	});

	const t = getTranslations(locale, verifyPageTranslations);

	function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
		const input = e.target.value;
		const formatted = formatPhoneNumber(input);
		dispatchVerify({ type: "phoneChanged", phoneNumber: formatted });
	}

	async function handleSendCode() {
		dispatchVerify({ type: "sendStarted" });

		if (!isValidPhone(phoneNumber)) {
			dispatchVerify({ type: "sendFailed", error: t.invalidPhoneNumber });
			return;
		}

		if (!turnstileToken) {
			dispatchVerify({ type: "sendFailed", error: "請完成驗證" });
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

			dispatchVerify({ type: "sendSucceeded" });
		} catch (err) {
			const error = err as Error;
			console.error("Failed to send SMS:", error);
			dispatchVerify({ type: "sendFailed", error: error.message || "Failed to send verification code" });
		}
	}

	function handleCodeChange(index: number, value: string) {
		if (!/^\d*$/.test(value)) return;

		const newCode = [...verificationCode];
		newCode[index] = value.slice(-1);
		dispatchVerify({ type: "codeChanged", code: newCode });

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
		dispatchVerify({ type: "codeChanged", code: newCode });

		const nextEmpty = newCode.findIndex(digit => digit === "");
		if (nextEmpty !== -1) {
			codeInputRefs.current[nextEmpty]?.focus();
		} else {
			codeInputRefs.current[5]?.focus();
			verifyCode(newCode.join(""));
		}
	}

	async function verifyCode(codeStr: string) {
		dispatchVerify({ type: "verifyStarted" });

		if (!codeStr.match(/^\d{6}$/)) {
			dispatchVerify({ type: "invalidCode", error: t.invalidCode });
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

			dispatchVerify({ type: "verifySucceeded" });

			setTimeout(() => {
				router.push(redirectUrl);
			}, 2000);
		} catch (err) {
			const error = err as Error;
			console.error("Verification failed:", error);
			dispatchVerify({ type: "verifyFailed", error: error.message || t.verifyFail });
			codeInputRefs.current[0]?.focus();
		}
	}

	async function handleResend() {
		dispatchVerify({ type: "sendStarted" });

		if (!turnstileToken) {
			dispatchVerify({ type: "sendFailed", error: "請完成驗證", resetToPhone: true });
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

			dispatchVerify({ type: "sendSucceeded" });
			codeInputRefs.current[0]?.focus();
		} catch (err) {
			const error = err as Error;
			console.error("Failed to resend SMS:", error);
			dispatchVerify({ type: "sendFailed", error: error.message || "Failed to resend verification code" });
		}
	}

	function handleBack() {
		dispatchVerify({ type: "backToPhone" });
	}

	const handleContinue = () => {
		router.push(redirectUrl);
	};

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => dispatchVerify({ type: "tickCountdown" }), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	return (
		<>
			<div className="flex items-center justify-center p-4 h-screen">
				<div className="w-full max-w-md">
					<div className="p-8">
						{step === "phone" && !isVerified && (
							<PhoneStep
								t={t}
								phoneNumber={phoneNumber}
								error={error}
								sendingCode={sendingCode}
								turnstileToken={turnstileToken}
								onPhoneChange={handlePhoneChange}
								onSendCode={handleSendCode}
								dispatchVerify={dispatchVerify}
							/>
						)}
						{step === "verify" && !isVerified && (
							<CodeStep
								t={t}
								phoneNumber={phoneNumber}
								verificationCode={verificationCode}
								loading={loading}
								sendingCode={sendingCode}
								error={error}
								countdown={countdown}
								codeInputRefs={codeInputRefs}
								onCodeChange={handleCodeChange}
								onCodeKeyDown={handleCodeKeyDown}
								onPaste={handlePaste}
								onResend={handleResend}
								onBack={handleBack}
							/>
						)}{" "}
						{isVerified && <VerifiedStep t={t} onContinue={handleContinue} />}
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

export default function VerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-4 h-screen">
					<Spinner />
				</div>
			}
		>
			<VerifyPageContent />
		</Suspense>
	);
}
