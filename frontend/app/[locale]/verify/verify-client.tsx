"use client";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { smsVerificationAPI } from "@/lib/api/endpoints";
import { errorMessage } from "@/lib/utils/text";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { ArrowLeft, ArrowRight, Check, MessageSquare, MessageSquareMore } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useRef } from "react";
import { safeReturnPath } from "../login/safe-return-path";

const verificationCodeSlots = [
	{ id: "first", index: 0 },
	{ id: "second", index: 1 },
	{ id: "third", index: 2 },
	{ id: "fourth", index: 3 },
	{ id: "fifth", index: 4 },
	{ id: "sixth", index: 5 }
] as const;

const CODE_LENGTH = verificationCodeSlots.length;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

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
	| { type: "inputInvalid"; error: string }
	| { type: "sendFailed"; error: string }
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
		case "inputInvalid":
			// Nothing was sent, so the Turnstile token is still unused and stays valid
			return { ...state, sendingCode: false, error: action.error };
		case "sendFailed":
			// The token was spent on the request; the widget has to be reset to issue a new one
			return { ...state, sendingCode: false, error: action.error, turnstileToken: null };
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
		en: "Phone Verification"
	},
	phoneNumberLabel: {
		"zh-Hant": "手機號碼",
		en: "Phone Number"
	},
	phoneNumberPlaceholder: {
		"zh-Hant": "請輸入手機號碼（09xxxxxxxx）",
		en: "Enter phone number (09xxxxxxxx)"
	},
	sendCode: {
		"zh-Hant": "發送驗證碼",
		en: "Send Code"
	},
	resendCode: {
		"zh-Hant": "重新發送",
		en: "Resend"
	},
	codeLabel: {
		"zh-Hant": "驗證碼",
		en: "Verification Code"
	},
	codePlaceholder: {
		"zh-Hant": "請輸入 6 位數驗證碼",
		en: "Enter 6-digit code"
	},
	verify: {
		"zh-Hant": "驗證",
		en: "Verify"
	},
	verified: {
		"zh-Hant": "已驗證",
		en: "Verified"
	},
	verifying: {
		"zh-Hant": "驗證中...",
		en: "Verifying..."
	},
	verifyFail: {
		"zh-Hant": "驗證失敗，請重試",
		en: "Verification failed, please try again"
	},
	invalidPhoneNumber: {
		"zh-Hant": "無效的手機號碼格式",
		en: "Invalid phone number format"
	},
	codeSent: {
		"zh-Hant": "驗證碼已發送至您的手機",
		en: "Verification code sent to your phone"
	},
	verificationSuccess: {
		"zh-Hant": "驗證成功！正在重新導向...",
		en: "Verification successful! Redirecting..."
	},
	description: {
		"zh-Hant": "請驗證您的手機號碼",
		en: "Please verify your phone number"
	},
	waitSeconds: {
		"zh-Hant": "秒後可重新發送",
		en: "seconds until resend"
	},
	invalidCode: {
		"zh-Hant": "驗證碼必須為 6 位數字",
		en: "Verification code must be 6 digits"
	},
	didntReceiveCode: {
		"zh-Hant": "沒有收到驗證碼？",
		en: "Didn't receive the code?"
	},
	resendIn: {
		"zh-Hant": "在",
		en: "Resend in"
	},
	resendSeconds: {
		"zh-Hant": "秒後重新發送...",
		en: "s"
	},
	changePhoneNumber: {
		"zh-Hant": "更換手機號碼",
		en: "Change phone number"
	},
	sendingCode: {
		"zh-Hant": "發送中...",
		en: "Sending..."
	},
	continue: {
		"zh-Hant": "繼續",
		en: "Continue"
	},
	completeVerification: {
		"zh-Hant": "請完成驗證",
		en: "Please complete the verification"
	},
	sendFailed: {
		"zh-Hant": "無法發送驗證碼，請稍後再試",
		en: "Failed to send verification code"
	},
	resendFailed: {
		"zh-Hant": "無法重新發送驗證碼，請稍後再試",
		en: "Failed to resend verification code"
	}
};

type VerifyTranslations = Record<string, string>;

function PhoneStep({
	t,
	phoneNumber,
	error,
	sendingCode,
	turnstileToken,
	turnstileRef,
	onPhoneChange,
	onSendCode,
	dispatchVerify
}: {
	t: VerifyTranslations;
	phoneNumber: string;
	error: string;
	sendingCode: boolean;
	turnstileToken: string | null;
	turnstileRef: React.RefObject<TurnstileInstance | null>;
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
				<p className="text-muted-foreground text-sm">{t.description}</p>
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
						autoComplete="tel-national"
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? "phone-number-error" : undefined}
						placeholder="09XX-XXX-XXX"
						className={`w-xs bg-gray-300/50 dark:bg-gray-700/50 border-2 rounded-md text-gray-700 dark:text-white text-base py-2 px-3
							transition-all duration-200 outline-none
							${error ? "border-red-500" : "border-gray-600"}
							focus:border-gray-400 focus:ring-2 focus:ring-gray-400/20
							placeholder-gray-500`}
						onKeyDown={e => e.key === "Enter" && onSendCode()}
					/>
					{error && (
						<p id="phone-number-error" className="text-destructive text-sm mt-2">
							{error}
						</p>
					)}
				</div>
			</div>

			<div className="flex justify-center mb-6">
				<VerifyTurnstile turnstileRef={turnstileRef} dispatchVerify={dispatchVerify} />
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

function VerifyTurnstile({ turnstileRef, dispatchVerify }: { turnstileRef: React.RefObject<TurnstileInstance | null>; dispatchVerify: React.Dispatch<VerifyAction> }) {
	return (
		<Turnstile
			ref={turnstileRef}
			siteKey={TURNSTILE_SITE_KEY}
			onSuccess={token => dispatchVerify({ type: "turnstileChanged", token })}
			onError={() => dispatchVerify({ type: "turnstileChanged", token: null })}
			onExpire={() => dispatchVerify({ type: "turnstileChanged", token: null })}
			options={{
				action: "sms-verification",
				theme: "auto",
				size: "normal"
			}}
		/>
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
	turnstileToken,
	turnstileRef,
	dispatchVerify,
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
	turnstileToken: string | null;
	turnstileRef: React.RefObject<TurnstileInstance | null>;
	dispatchVerify: React.Dispatch<VerifyAction>;
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
							// No maxLength: an autofilled one-time code arrives in a single box and is spread over the others
							autoComplete="one-time-code"
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

				{error && <p className="text-destructive text-sm text-center mt-3">{error}</p>}

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
					<div className="flex flex-col items-center gap-3">
						{/* Every send spends a Turnstile token, so a resend needs a fresh challenge of its own */}
						<VerifyTurnstile turnstileRef={turnstileRef} dispatchVerify={dispatchVerify} />
						<Button
							variant="link"
							onClick={onResend}
							disabled={sendingCode || !turnstileToken}
							className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline h-auto p-0"
						>
							{sendingCode ? t.sendingCode : t.resendCode}
						</Button>
					</div>
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
	const turnstileRef = useRef<TurnstileInstance>(null);
	// Set when a failed verification should move focus back to the first box once the inputs are enabled again
	const focusFirstCodeInputRef = useRef(false);
	const redirectUrl = safeReturnPath(searchParams.get("redirect"), locale);

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
			dispatchVerify({ type: "inputInvalid", error: t.invalidPhoneNumber });
			return;
		}

		if (!turnstileToken) {
			dispatchVerify({ type: "inputInvalid", error: t.completeVerification });
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
			console.error("Failed to send SMS:", err);
			dispatchVerify({ type: "sendFailed", error: errorMessage(err, t.sendFailed) });
			turnstileRef.current?.reset();
		}
	}

	/** Spreads several digits over the boxes from `start` (a paste or an autofilled one-time code) and verifies once all are filled. */
	function fillCode(digits: string, start: number) {
		const newCode = [...verificationCode];
		digits
			.slice(0, CODE_LENGTH - start)
			.split("")
			.forEach((char, i) => {
				newCode[start + i] = char;
			});
		dispatchVerify({ type: "codeChanged", code: newCode });

		const nextEmpty = newCode.findIndex(digit => digit === "");
		if (nextEmpty !== -1) {
			codeInputRefs.current[nextEmpty]?.focus();
		} else {
			codeInputRefs.current[CODE_LENGTH - 1]?.focus();
			void verifyCode(newCode.join(""));
		}
	}

	function handleCodeChange(index: number, value: string) {
		const digits = value.replace(/\D/g, "");
		if (value !== "" && digits === "") return;

		const current = verificationCode[index];
		// SMS autofill (autocomplete="one-time-code") drops the whole code into whichever box is focused
		if (digits.length >= CODE_LENGTH) {
			fillCode(digits, 0);
			return;
		}
		if (digits.length > 1 && !current) {
			fillCode(digits, index);
			return;
		}

		const newCode = [...verificationCode];
		// Typing into a filled box yields the old digit plus the new one, on either side of it
		newCode[index] = digits.length === 2 && current ? (digits[0] === current ? digits[1] : digits[0]) : digits.slice(-1);
		dispatchVerify({ type: "codeChanged", code: newCode });

		if (digits && index < CODE_LENGTH - 1) {
			codeInputRefs.current[index + 1]?.focus();
		}

		if (newCode.every(digit => digit !== "") && newCode.join("").length === CODE_LENGTH) {
			void verifyCode(newCode.join(""));
		}
	}

	function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
			codeInputRefs.current[index - 1]?.focus();
		} else if (e.key === "Enter" && verificationCode.every(digit => digit !== "")) {
			void verifyCode(verificationCode.join(""));
		}
	}

	function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
		e.preventDefault();
		const pastedData = e.clipboardData.getData("text").trim();
		if (!/^\d+$/.test(pastedData)) return;

		fillCode(pastedData, 0);
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
			console.error("Verification failed:", err);
			dispatchVerify({ type: "verifyFailed", error: errorMessage(err, t.verifyFail) });
			// The boxes are still disabled at this point; the effect below focuses the first one once they are enabled
			focusFirstCodeInputRef.current = true;
		}
	}

	async function handleResend() {
		dispatchVerify({ type: "sendStarted" });

		if (!turnstileToken) {
			dispatchVerify({ type: "inputInvalid", error: t.completeVerification });
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
			console.error("Failed to resend SMS:", err);
			dispatchVerify({ type: "sendFailed", error: errorMessage(err, t.resendFailed) });
			turnstileRef.current?.reset();
		}
	}

	function handleBack() {
		dispatchVerify({ type: "backToPhone" });
	}

	const handleContinue = () => {
		router.push(redirectUrl);
	};

	useEffect(() => {
		if (!loading && focusFirstCodeInputRef.current) {
			focusFirstCodeInputRef.current = false;
			codeInputRefs.current[0]?.focus();
		}
	}, [loading]);

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
								turnstileRef={turnstileRef}
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
								turnstileToken={turnstileToken}
								turnstileRef={turnstileRef}
								dispatchVerify={dispatchVerify}
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
