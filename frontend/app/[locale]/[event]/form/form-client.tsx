"use client";

import { FormField } from "@/components/form/FormField";
import Checkbox from "@/components/input/Checkbox";
import Text from "@/components/input/Text";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { eventsAPI, registrationsAPI, smsVerificationAPI, ticketsAPI } from "@/lib/api/endpoints";
import type { FormDataType } from "@/lib/types/data";
import { focusFormField, getFormErrorMessages, getFormErrorsFromApiError, normalizeTicketFormFields } from "@/lib/utils/formFields";
import { getLocalizedText } from "@/lib/utils/localization";
import { getVisibleFieldIds, LocalizedText, pruneFormData, TicketFormField, validateFormData } from "@sitcontix/types";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

const formDataStorageKey = "formData:v1";
const legacyFormDataStorageKey = "formData";
const TERMS_FIELD_ID = "agreeToTerms";
const VISIBILITY_REFRESH_MS = 30_000;

type AutosavedFormState = {
	formData: FormDataType;
	referralCode: string;
	agreeToTerms: boolean;
};

type AutosavedFormAction =
	| { type: "setField"; name: string; value: FormDataType[string] }
	| { type: "setReferralCode"; referralCode: string }
	| { type: "setAgreeToTerms"; agreeToTerms: boolean }
	| { type: "restore"; formData: FormDataType; referralCode: string };

function autosavedFormReducer(state: AutosavedFormState, action: AutosavedFormAction): AutosavedFormState {
	switch (action.type) {
		case "setField":
			return { ...state, formData: { ...state.formData, [action.name]: action.value } };
		case "setReferralCode":
			return { ...state, referralCode: action.referralCode };
		case "setAgreeToTerms":
			return { ...state, agreeToTerms: action.agreeToTerms };
		case "restore":
			// A referral code that came with the current link wins over an older saved one; consent is never restored.
			return { ...state, formData: action.formData, referralCode: state.referralCode || action.referralCode };
		default:
			return state;
	}
}

type PageError = { kind: "message"; message: string } | { kind: "failed"; message: string } | { kind: "verification" };

type FormPageState = {
	loading: boolean;
	error: PageError | null;
	formFields: TicketFormField[];
	ticketId: string | null;
	ticketName: LocalizedText | null;
	isSubmitting: boolean;
};

type FormPageAction =
	| { type: "ticketLoaded"; ticketId: string }
	| { type: "formLoaded"; formFields: TicketFormField[]; ticketName: LocalizedText }
	| { type: "loadFailed"; message: string }
	| { type: "unavailable"; message: string }
	| { type: "verificationRequired" }
	| { type: "submitStarted" }
	| { type: "submitFailed" };

function formPageReducer(state: FormPageState, action: FormPageAction): FormPageState {
	switch (action.type) {
		case "ticketLoaded":
			return { ...state, ticketId: action.ticketId };
		case "formLoaded":
			return { ...state, loading: false, error: null, formFields: action.formFields, ticketName: action.ticketName };
		case "loadFailed":
			return { ...state, loading: false, error: { kind: "failed", message: action.message } };
		case "unavailable":
			return { ...state, loading: false, error: { kind: "message", message: action.message } };
		case "verificationRequired":
			return { ...state, loading: false, error: { kind: "verification" } };
		case "submitStarted":
			return { ...state, isSubmitting: true };
		case "submitFailed":
			return { ...state, isSubmitting: false };
		default:
			return state;
	}
}

const formPageTranslations = {
	noTicketAlert: {
		"zh-Hant": "未指定票種，請重新選擇",
		"zh-Hans": "未指定票种，请重新选择",
		en: "No ticket specified, please select again"
	},
	incompleteFormAlert: {
		"zh-Hant": "表單資料不完整，請重新選擇票種",
		"zh-Hans": "表单资料不完整，请重新选择票种",
		en: "Form data incomplete, please select ticket again"
	},
	registrationFailedAlert: {
		"zh-Hant": "報名失敗：",
		"zh-Hans": "报名失败：",
		en: "Registration failed: "
	},
	pleaseSelect: {
		"zh-Hant": "請選擇...",
		"zh-Hans": "请选择...",
		en: "Please select..."
	},
	reselectTicket: {
		"zh-Hant": "重新選擇票種",
		"zh-Hans": "重新选择票种",
		en: "Reselect Ticket"
	},
	fillForm: {
		"zh-Hant": "填寫報名資訊",
		"zh-Hans": "填写报名资讯",
		en: "Fill Registration Form"
	},
	ticketLabel: {
		"zh-Hant": "票種",
		"zh-Hans": "票种",
		en: "Ticket"
	},
	loadingForm: {
		"zh-Hant": "載入表單中...",
		"zh-Hans": "载入表单中...",
		en: "Loading form..."
	},
	loadFormFailed: {
		"zh-Hant": "載入表單失敗：",
		"zh-Hans": "载入表单失败：",
		en: "Failed to load form: "
	},
	eventNotFound: {
		"zh-Hant": "找不到此活動",
		"zh-Hans": "找不到此活动",
		en: "Event not found"
	},
	referralCode: {
		"zh-Hant": "推薦碼",
		"zh-Hans": "推荐码",
		en: "Referral Code"
	},
	referralCodeOptional: {
		"zh-Hant": "推薦碼（選填）",
		"zh-Hans": "推荐码（选填）",
		en: "Referral Code (Optional)"
	},
	submitRegistration: {
		"zh-Hant": "提交報名",
		"zh-Hans": "提交报名",
		en: "Submit Registration"
	},
	agreeToTermsPrefix: {
		"zh-Hant": "我已閱讀並同意",
		"zh-Hans": "我已阅读并同意",
		en: "I have read and agree to the "
	},
	termsLinkText: {
		"zh-Hant": "服務條款與隱私政策",
		"zh-Hans": "服务条款与隐私政策",
		en: "Terms and Privacy Policy"
	},
	termsRequired: {
		"zh-Hant": "請先同意服務條款與隱私政策",
		"zh-Hans": "请先同意服务条款与隐私政策",
		en: "Please agree to the Terms and Privacy Policy"
	},
	checkFields: {
		"zh-Hant": "請檢查標示的欄位後再提交",
		"zh-Hans": "请检查标示的栏位后再提交",
		en: "Please check the highlighted fields and submit again"
	},
	formChanged: {
		"zh-Hant": "表單內容已更新，請重新檢查後再提交",
		"zh-Hans": "表单内容已更新，请重新检查后再提交",
		en: "The form has changed, please review it and submit again"
	},
	ticketSaleEnded: {
		"zh-Hant": "此票種報名時間已結束",
		"zh-Hans": "此票种报名时间已结束",
		en: "This ticket's registration period has ended"
	},
	ticketNotYetAvailable: {
		"zh-Hant": "此票種尚未開放報名",
		"zh-Hans": "此票种尚未开放报名",
		en: "Registration for this ticket has not opened yet"
	},
	ticketSoldOut: {
		"zh-Hant": "此票種已售完",
		"zh-Hans": "此票种已售完",
		en: "This ticket is sold out"
	},
	phoneVerificationRequired: {
		"zh-Hant": "此票種需要先驗證手機號碼才能報名",
		"zh-Hans": "此票种需要先验证手机号码才能报名",
		en: "This ticket requires a verified phone number before you can register"
	},
	verifyPhone: {
		"zh-Hant": "前往驗證手機號碼",
		"zh-Hans": "前往验证手机号码",
		en: "Verify phone number"
	},
	autosaveRestored: {
		"zh-Hant": "已自動恢復您之前填寫的表單資料",
		"zh-Hans": "已自动恢复您之前填写的表单资料",
		en: "Your previously entered form data has been restored"
	}
};

type RegistrationFormViewProps = {
	t: Record<string, string>;
	loading: boolean;
	error: PageError | null;
	eventPath: string;
	verifyHref: string;
	ticketName: string;
	visibleFields: TicketFormField[];
	formData: FormDataType;
	fieldErrors: Record<string, string>;
	termsError: string | undefined;
	referralCode: string;
	agreeToTerms: boolean;
	isSubmitting: boolean;
	onBack: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onValueChange: (fieldId: string, value: string | boolean | string[]) => void;
	onAgreeChange: (agree: boolean) => void;
	dispatchAutosavedForm: React.Dispatch<AutosavedFormAction>;
};

function RegistrationFormView({
	t,
	loading,
	error,
	eventPath,
	verifyHref,
	ticketName,
	visibleFields,
	formData,
	fieldErrors,
	termsError,
	referralCode,
	agreeToTerms,
	isSubmitting,
	onBack,
	onSubmit,
	onValueChange,
	onAgreeChange,
	dispatchAutosavedForm
}: RegistrationFormViewProps) {
	return (
		<main className="mt-24 px-4 pb-16 md:mt-32">
			<section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:p-10 md:p-16">
				<Button variant="secondary" onClick={onBack}>
					<ChevronLeft />
					<p>{t.reselectTicket}</p>
				</Button>
				<h1 className="mt-8 mb-2 text-3xl md:text-4xl">{t.fillForm}</h1>
				{ticketName && (
					<p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
						{t.ticketLabel}: {ticketName}
					</p>
				)}

				{loading && (
					<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70">
						<PageSpinner />
						<p>{t.loadingForm}</p>
					</div>
				)}

				{error && (
					<div className="p-8 text-center">
						{error.kind === "verification" ? (
							<>
								<p className="mb-4 text-red-600">{t.phoneVerificationRequired}</p>
								<Button asChild>
									<Link href={verifyHref}>{t.verifyPhone}</Link>
								</Button>
							</>
						) : (
							<>
								<p className="mb-4 text-red-600">
									{error.kind === "failed" && t.loadFormFailed}
									{error.message}
								</p>
								<Button asChild variant="secondary">
									<Link href={eventPath}>{t.reselectTicket}</Link>
								</Button>
							</>
						)}
					</div>
				)}

				{!loading && !error && (
					<form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
						{visibleFields.map(field => (
							<FormField
								key={field.id}
								field={field}
								value={formData[field.id]}
								onValueChange={onValueChange}
								pleaseSelectText={t.pleaseSelect}
								error={fieldErrors[field.id]}
								disabled={isSubmitting}
							/>
						))}

						<Text
							label={t.referralCodeOptional}
							id="referralCode"
							value={referralCode}
							required={false}
							disabled={isSubmitting}
							onChange={e => dispatchAutosavedForm({ type: "setReferralCode", referralCode: e.target.value })}
							placeholder={t.referralCode}
						/>

						<div data-field-id={TERMS_FIELD_ID}>
							<Checkbox
								id={TERMS_FIELD_ID}
								required
								checked={agreeToTerms}
								disabled={isSubmitting}
								error={termsError}
								onChange={e => onAgreeChange(e.target.checked)}
								label={
									<span>
										{t.agreeToTermsPrefix}
										<Link href="/terms" target="_blank" className="underline underline-offset-2">
											{t.termsLinkText}
										</Link>
									</span>
								}
							/>
						</div>

						<div className="flex justify-center pt-2">
							<Button type="submit" isLoading={isSubmitting} size="lg" className="w-full sm:w-auto">
								{t.submitRegistration}
							</Button>
						</div>
					</form>
				)}
			</section>
		</main>
	);
}

export default function FormPage() {
	const router = useRouter();
	const locale = useLocale();
	const pathname = usePathname();
	const params = useParams();
	const { showAlert } = useAlert();
	const eventSlug = params.event as string;

	const [{ loading, error, formFields, ticketId, ticketName, isSubmitting }, dispatchFormPage] = useReducer(formPageReducer, {
		loading: true,
		error: null,
		formFields: [],
		ticketId: null,
		ticketName: null,
		isSubmitting: false
	});
	const [{ formData, referralCode, agreeToTerms }, dispatchAutosavedForm] = useReducer(autosavedFormReducer, {
		formData: {},
		referralCode: "",
		agreeToTerms: false
	});
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [termsError, setTermsError] = useState<string | undefined>();
	// Time conditions are evaluated against this clock; it is refreshed periodically and on submit.
	const [now, setNow] = useState(() => new Date());
	const eventIdRef = useRef<string | null>(null);
	const invitationCodeRef = useRef("");
	const autosaveRestoredRef = useRef(false);

	const autosaveKey = ticketId ? `formAutosave_${ticketId}` : null;
	const eventPath = pathname.replace(/\/form$/, "");
	const verifyHref = `/verify?redirect=${encodeURIComponent(pathname)}`;

	const t = getTranslations(locale, formPageTranslations);

	const handleValueChange = useCallback((fieldId: string, value: string | boolean | string[]) => {
		dispatchAutosavedForm({ type: "setField", name: fieldId, value });
		setFieldErrors(prev => {
			if (!(fieldId in prev)) return prev;
			const { [fieldId]: _cleared, ...rest } = prev;
			return rest;
		});
	}, []);

	const handleAgreeChange = useCallback((agree: boolean) => {
		dispatchAutosavedForm({ type: "setAgreeToTerms", agreeToTerms: agree });
		if (agree) setTermsError(undefined);
	}, []);

	useEffect(() => {
		const timer = setInterval(() => setNow(new Date()), VISIBILITY_REFRESH_MS);
		return () => clearInterval(timer);
	}, []);

	const visibleIds = useMemo(() => {
		if (!ticketId) return new Set(formFields.map(field => field.id));
		return getVisibleFieldIds(formFields, { ticketId, formData, now });
	}, [formFields, ticketId, formData, now]);

	const visibleFields = useMemo(() => formFields.filter(field => visibleIds.has(field.id)), [formFields, visibleIds]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const eventId = eventIdRef.current;
		if (!ticketId || !eventId) {
			showAlert(t.incompleteFormAlert, "warning");
			router.push("/");
			return;
		}
		if (isSubmitting) return;

		const submitTime = new Date();
		setNow(submitTime);
		const context = { ticketId, formData, now: submitTime };

		const messages = getFormErrorMessages(validateFormData(formFields, context), locale);
		const missingTerms = !agreeToTerms;
		setFieldErrors(messages);
		setTermsError(missingTerms ? t.termsRequired : undefined);

		const firstInvalidId = formFields.find(field => messages[field.id])?.id ?? (missingTerms ? TERMS_FIELD_ID : undefined);
		if (firstInvalidId) {
			showAlert(t.checkFields, "error");
			focusFormField(firstInvalidId);
			return;
		}

		dispatchFormPage({ type: "submitStarted" });
		try {
			const registrationData = {
				eventId,
				ticketId,
				formData: pruneFormData(formData, getVisibleFieldIds(formFields, context)),
				invitationCode: invitationCodeRef.current.trim() || undefined,
				referralCode: referralCode.trim() || undefined
			};

			const result = await registrationsAPI.create(registrationData);

			if (result.success) {
				localStorage.removeItem(formDataStorageKey);
				localStorage.removeItem(legacyFormDataStorageKey);
				localStorage.removeItem("referralCode");
				localStorage.removeItem("invitationCode");
				// Clear autosaved form data on successful submission
				if (autosaveKey) {
					localStorage.removeItem(autosaveKey);
				}
				router.push(`${eventPath}/success`);
			} else {
				throw new Error(result.message || "Registration failed");
			}
		} catch (error) {
			const serverErrors = getFormErrorsFromApiError(error);
			if (serverErrors) {
				// The server disagrees with this form (validation rules or a time window changed meanwhile).
				const refreshed = new Date();
				setNow(refreshed);
				const messagesFromServer = getFormErrorMessages(serverErrors, locale);
				const refreshedVisible = getVisibleFieldIds(formFields, { ticketId, formData, now: refreshed });
				const shown = formFields.filter(field => messagesFromServer[field.id] && refreshedVisible.has(field.id));
				setFieldErrors(messagesFromServer);
				if (shown.length > 0) {
					showAlert(t.checkFields, "error");
					focusFormField(shown[0].id);
				} else {
					showAlert(t.formChanged, "warning");
				}
			} else {
				showAlert(t.registrationFailedAlert + (error instanceof Error ? error.message : "Unknown error"), "error");
			}
			dispatchFormPage({ type: "submitFailed" });
		}
	}

	useEffect(() => {
		async function initForm() {
			try {
				const storedData = localStorage.getItem(formDataStorageKey) || localStorage.getItem(legacyFormDataStorageKey);
				let parsedData: { ticketId?: string; eventId?: string; referralCode?: string; invitationCode?: string } | null = null;
				try {
					parsedData = storedData ? JSON.parse(storedData) : null;
				} catch {
					parsedData = null;
				}
				if (!parsedData?.ticketId || !parsedData.eventId) {
					dispatchFormPage({ type: "unavailable", message: t.noTicketAlert });
					return;
				}

				const [eventsResponse, ticketResponse] = await Promise.all([eventsAPI.getAll(), ticketsAPI.getTicket(parsedData.ticketId)]);

				// The stored ticket must belong to the event in the URL, otherwise it is left over from another event.
				const currentEvent = eventsResponse.success ? eventsResponse.data.find(event => event.slug === eventSlug || event.id.slice(-6) === eventSlug) : undefined;
				if (!currentEvent) {
					dispatchFormPage({ type: "loadFailed", message: t.eventNotFound });
					return;
				}
				if (currentEvent.id !== parsedData.eventId) {
					dispatchFormPage({ type: "unavailable", message: t.noTicketAlert });
					return;
				}

				dispatchFormPage({ type: "ticketLoaded", ticketId: parsedData.ticketId });
				eventIdRef.current = parsedData.eventId;
				dispatchAutosavedForm({ type: "setReferralCode", referralCode: parsedData.referralCode || "" });
				invitationCodeRef.current = parsedData.invitationCode || "";

				if (!ticketResponse.success) {
					throw new Error(ticketResponse.message || "Failed to load ticket information");
				}

				const ticket = ticketResponse.data;

				if (ticket.requireSmsVerification) {
					try {
						const smsStatus = await smsVerificationAPI.getStatus();
						if (!smsStatus?.data?.phoneVerified) {
							dispatchFormPage({ type: "verificationRequired" });
							return;
						}
					} catch (error) {
						console.error("Failed to check SMS verification status:", error);
						// 不能檢查就先導過去
						dispatchFormPage({ type: "verificationRequired" });
						return;
					}
				}

				const currentTime = new Date();
				if (ticket.saleEnd && ticket.saleEnd < currentTime) {
					dispatchFormPage({ type: "unavailable", message: t.ticketSaleEnded });
					return;
				}

				if (ticket.saleStart && ticket.saleStart > currentTime) {
					dispatchFormPage({ type: "unavailable", message: t.ticketNotYetAvailable });
					return;
				}

				if (ticket.available <= 0) {
					dispatchFormPage({ type: "unavailable", message: t.ticketSoldOut });
					return;
				}

				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error(formFieldsData.message || "Failed to load form fields");
				}

				dispatchFormPage({ type: "formLoaded", formFields: normalizeTicketFormFields(formFieldsData.data || [], parsedData.eventId), ticketName: ticket.name });
			} catch (error) {
				console.error("Failed to initialize form:", error);
				dispatchFormPage({ type: "loadFailed", message: error instanceof Error ? error.message : "Unknown error" });
			}
		}

		void initForm();
	}, [eventSlug, t.noTicketAlert, t.eventNotFound, t.ticketSaleEnded, t.ticketNotYetAvailable, t.ticketSoldOut]);

	useEffect(() => {
		if (!autosaveKey || error || !autosaveRestoredRef.current) return;

		// Consent is deliberately not saved: it has to be given again on every visit.
		localStorage.setItem(autosaveKey, JSON.stringify({ formData, referralCode, savedAt: Date.now() }));
	}, [autosaveKey, error, formData, referralCode]);

	useEffect(() => {
		if (!autosaveKey || loading || error || autosaveRestoredRef.current) return;

		try {
			const savedData = localStorage.getItem(autosaveKey);
			if (savedData) {
				const parsed = JSON.parse(savedData);

				const twentyFourHours = 24 * 60 * 60 * 1000;
				if (parsed.savedAt && Date.now() - parsed.savedAt < twentyFourHours) {
					// Only answers to fields that still exist can be restored.
					const fieldIds = new Set(formFields.map(field => field.id));
					const savedAnswers: FormDataType = parsed.formData && typeof parsed.formData === "object" ? parsed.formData : {};
					const restoredAnswers = Object.fromEntries(Object.entries(savedAnswers).filter(([fieldId]) => fieldIds.has(fieldId)));
					const restoredReferralCode = typeof parsed.referralCode === "string" ? parsed.referralCode : "";

					if (Object.keys(restoredAnswers).length > 0 || restoredReferralCode) {
						dispatchAutosavedForm({ type: "restore", formData: restoredAnswers, referralCode: restoredReferralCode });
						showAlert(t.autosaveRestored, "info");
					}
				} else {
					localStorage.removeItem(autosaveKey);
				}
			}
		} catch (error) {
			console.error("Failed to restore autosaved form data:", error);
		}

		autosaveRestoredRef.current = true;
	}, [autosaveKey, loading, error, formFields, showAlert, t.autosaveRestored]);

	return (
		<RegistrationFormView
			t={t}
			loading={loading}
			error={error}
			eventPath={eventPath}
			verifyHref={verifyHref}
			ticketName={ticketName ? getLocalizedText(ticketName, locale) : ""}
			visibleFields={visibleFields}
			formData={formData}
			fieldErrors={fieldErrors}
			termsError={termsError}
			referralCode={referralCode}
			agreeToTerms={agreeToTerms}
			isSubmitting={isSubmitting}
			onBack={() => router.push(eventPath)}
			onSubmit={handleSubmit}
			onValueChange={handleValueChange}
			onAgreeChange={handleAgreeChange}
			dispatchAutosavedForm={dispatchAutosavedForm}
		/>
	);
}
