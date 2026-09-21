"use client";

import { FormField } from "@/components/form/FormField";
import Checkbox from "@/components/input/Checkbox";
import Text from "@/components/input/Text";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { registrationsAPI, smsVerificationAPI, ticketsAPI } from "@/lib/api/endpoints";
import type { FormDataType } from "@/lib/types/data";
import { shouldDisplayField } from "@/lib/utils/filterEvaluation";
import { normalizeFormFieldOption } from "@/lib/utils/localization";
import { FormFieldOption, LocalizedText, PublicTicketDetailSchema, TicketFormField } from "@sitcontix/types";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { z } from "zod/v4";

const formDataStorageKey = "formData:v1";
const legacyFormDataStorageKey = "formData";

type AutosavedFormState = {
	formData: FormDataType;
	referralCode: string;
	agreeToTerms: boolean;
};

type AutosavedFormAction =
	| { type: "setField"; name: string; value: FormDataType[string] }
	| { type: "setCheckbox"; name: string; checked: boolean }
	| { type: "setMultiCheckbox"; name: string; values: string[] }
	| { type: "toggleLegacyCheckbox"; name: string; checked: boolean; value: string }
	| { type: "setReferralCode"; referralCode: string }
	| { type: "setAgreeToTerms"; agreeToTerms: boolean }
	| { type: "restore"; values: Partial<AutosavedFormState> };

function autosavedFormReducer(state: AutosavedFormState, action: AutosavedFormAction): AutosavedFormState {
	switch (action.type) {
		case "setField":
			return { ...state, formData: { ...state.formData, [action.name]: action.value } };
		case "setCheckbox":
			return { ...state, formData: { ...state.formData, [action.name]: action.checked } };
		case "setMultiCheckbox":
			return { ...state, formData: { ...state.formData, [action.name]: action.values } };
		case "toggleLegacyCheckbox": {
			const currentValues = Array.isArray(state.formData[action.name]) ? (state.formData[action.name] as string[]) : [];
			const nextValues = action.checked ? [...currentValues, action.value] : currentValues.filter(item => item !== action.value);
			return { ...state, formData: { ...state.formData, [action.name]: nextValues } };
		}
		case "setReferralCode":
			return { ...state, referralCode: action.referralCode };
		case "setAgreeToTerms":
			return { ...state, agreeToTerms: action.agreeToTerms };
		case "restore":
			return { ...state, ...action.values };
		default:
			return state;
	}
}

type FormPageState = {
	loading: boolean;
	error: string | null;
	formFields: TicketFormField[];
	ticketId: string | null;
	isSubmitting: boolean;
};

type FormPageAction =
	| { type: "ticketLoaded"; ticketId: string }
	| { type: "formLoaded"; formFields: TicketFormField[] }
	| { type: "loadFailed"; error: string }
	| { type: "verificationRequired" }
	| { type: "submitStarted" }
	| { type: "submitFailed" };

function formPageReducer(state: FormPageState, action: FormPageAction): FormPageState {
	switch (action.type) {
		case "ticketLoaded":
			return { ...state, ticketId: action.ticketId };
		case "formLoaded":
			return { ...state, loading: false, error: null, formFields: action.formFields };
		case "loadFailed":
			return { ...state, loading: false, error: action.error };
		case "verificationRequired":
			return { ...state, loading: false, error: "verificationRequired" };
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
	backToHome: {
		"zh-Hant": "返回首頁",
		"zh-Hans": "返回首页",
		en: "Back to Home"
	},
	name: {
		"zh-Hant": "姓名",
		"zh-Hans": "姓名",
		en: "Name"
	},
	invitationCode: {
		"zh-Hant": "邀請碼",
		"zh-Hans": "邀请码",
		en: "Invitation Code"
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
	agreeToTerms: {
		"zh-Hant": "我已閱讀並同意服務條款與隱私政策",
		"zh-Hans": "我已阅读并同意服务条款与隐私政策",
		en: "I have read and agree to the Terms and Privacy Policy"
	},
	ticketSaleEnded: {
		"zh-Hant": "此票種報名時間已結束",
		"zh-Hans": "此票种报名时间已结束",
		en: "This ticket's registration period has ended"
	},
	ticketNotYetAvailable: {
		"zh-Hant": "此票種尚未開放報名，請先登入後再試",
		"zh-Hans": "此票种尚未开放报名，请先登录后再试",
		en: "This ticket is not yet available for registration. Please log in and try again later"
	},
	ticketSoldOut: {
		"zh-Hant": "此票種已售完",
		"zh-Hans": "此票种已售完",
		en: "This ticket is sold out"
	},
	autosaveRestored: {
		"zh-Hant": "已自動恢復您之前填寫的表單資料",
		"zh-Hans": "已自动恢复您之前填写的表单资料",
		en: "Your previously entered form data has been restored"
	}
};

type RawTicketFormField = Omit<TicketFormField, "eventId" | "options"> &
	Partial<Pick<TicketFormField, "eventId">> & {
		options?: FormFieldOption[] | null;
	};

function normalizeTicketFormFields(fields: RawTicketFormField[], eventId: string): TicketFormField[] {
	return fields.map(field => {
		let name: LocalizedText = field.name;
		if (typeof name === "string" && name === "[object Object]") {
			name = { en: typeof field.description === "string" ? field.description : "field" };
		} else if (typeof name === "string") {
			const rawName = name;
			try {
				name = JSON.parse(rawName);
			} catch {
				name = { en: rawName };
			}
		}

		// Legacy data may still store the description as a (JSON) string
		let description = (field.description ?? undefined) as LocalizedText | string | undefined;
		if (typeof description === "string" && description.startsWith("{")) {
			const originalStr = description;
			try {
				description = JSON.parse(description);
			} catch {
				description = { en: originalStr };
			}
		} else if (typeof description === "string") {
			description = { en: description };
		}

		const options = (field.options || []).map(normalizeFormFieldOption);

		let filters = field.filters;
		if (typeof filters === "string") {
			try {
				filters = JSON.parse(filters);
			} catch {
				filters = undefined;
			}
		}

		return {
			...field,
			eventId,
			type: field.type,
			name,
			description: description as LocalizedText | undefined,
			options,
			filters: filters,
			prompts: field.prompts
		};
	});
}

type RegistrationFormViewProps = {
	t: Record<string, string>;
	loading: boolean;
	error: string | null;
	pathname: string;
	verifyHref: string;
	visibleFields: TicketFormField[];
	formData: FormDataType;
	referralCode: string;
	agreeToTerms: boolean;
	isSubmitting: boolean;
	onBack: () => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
	onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
	onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	dispatchAutosavedForm: React.Dispatch<AutosavedFormAction>;
};

function RegistrationFormView({
	t,
	loading,
	error,
	pathname,
	verifyHref,
	visibleFields,
	formData,
	referralCode,
	agreeToTerms,
	isSubmitting,
	onBack,
	onSubmit,
	onTextChange,
	onCheckboxChange,
	dispatchAutosavedForm
}: RegistrationFormViewProps) {
	return (
		<main className="mt-32">
			<section className="max-w-3xl mx-auto p-16 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
				<Button variant="secondary" onClick={onBack}>
					<ChevronLeft />
					<p>{t.reselectTicket}</p>
				</Button>
				<h1 className="my-8 text-4xl">{t.fillForm}</h1>

				{loading && (
					<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70">
						<PageSpinner />
						<p>{t.loadingForm}</p>
					</div>
				)}

				{error && (
					<div className="text-center p-8">
						{error === "verificationRequired" ? (
							<>
								<p className="text-red-600 mb-4">{t.ticketNotYetAvailable}</p>
								<Button asChild>
									<Link href={verifyHref}>{t.submitRegistration}</Link>
								</Button>
							</>
						) : (
							<>
								<p className="text-red-600 mb-4">
									{t.loadFormFailed}
									{error}
								</p>
								<Button asChild variant="secondary">
									<Link href={pathname.replace("/form", "")}>{t.reselectTicket}</Link>
								</Button>
							</>
						)}
					</div>
				)}

				{!loading && !error && (
					<form onSubmit={onSubmit} className="flex flex-col gap-6">
						{visibleFields.map(field => (
							<FormField key={field.id} field={field} value={formData[field.id] || ""} onTextChange={onTextChange} onCheckboxChange={onCheckboxChange} pleaseSelectText={t.pleaseSelect} />
						))}

						<Text
							label={t.referralCodeOptional}
							id="referralCode"
							value={referralCode}
							required={false}
							onChange={e => dispatchAutosavedForm({ type: "setReferralCode", referralCode: e.target.value })}
							placeholder={t.referralCode}
						/>

						<div>
							<div className="flex items-center space-x-2">
								<Checkbox id="agreeToTerms" required checked={agreeToTerms} onChange={e => dispatchAutosavedForm({ type: "setAgreeToTerms", agreeToTerms: e.target.checked })} label={t.agreeToTerms} />
							</div>
						</div>

						<div className="justify-between flex">
							<div />
							<Button type="submit" isLoading={isSubmitting} size={"lg"}>
								{t.submitRegistration}
							</Button>
							<div />
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
	const { showAlert } = useAlert();

	const [{ loading, error, formFields, ticketId, isSubmitting }, dispatchFormPage] = useReducer(formPageReducer, {
		loading: true,
		error: null,
		formFields: [],
		ticketId: null,
		isSubmitting: false
	});
	const [{ formData, referralCode, agreeToTerms }, dispatchAutosavedForm] = useReducer(autosavedFormReducer, {
		formData: {},
		referralCode: "",
		agreeToTerms: false
	});
	const eventIdRef = useRef<string | null>(null);
	const invitationCodeRef = useRef("");
	const autosaveRestoredRef = useRef(false);

	const autosaveKey = ticketId ? `formAutosave_${ticketId}` : null;
	const verifyHref = `/verify?redirect=${encodeURIComponent(pathname)}`;

	const t = getTranslations(locale, formPageTranslations);

	const isTicketExpired = useCallback((ticket: z.infer<typeof PublicTicketDetailSchema>): boolean => {
		if (!ticket.saleEnd) return false;
		return ticket.saleEnd < new Date();
	}, []);

	const isTicketNotYetAvailable = useCallback((ticket: z.infer<typeof PublicTicketDetailSchema>): boolean => {
		if (!ticket.saleStart) return false;
		return ticket.saleStart > new Date();
	}, []);

	const isTicketSoldOut = useCallback((ticket: z.infer<typeof PublicTicketDetailSchema>): boolean => {
		return ticket.available !== undefined && ticket.available <= 0;
	}, []);

	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		dispatchAutosavedForm({ type: "setField", name, value });
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === "true") {
			// Single checkbox (boolean value)
			dispatchAutosavedForm({ type: "setCheckbox", name, checked });
		} else if (checked && value !== "true") {
			// Multi-checkbox with comma-separated values
			// When checked is true and value is not "true", this is from MultiCheckbox
			// The value contains the comma-separated list (or empty string if all unchecked)
			const values = value === "" ? [] : value.split(",").filter(v => v.trim() !== "");
			dispatchAutosavedForm({ type: "setMultiCheckbox", name, values });
		} else {
			// Single checkbox with a specific value (legacy support)
			dispatchAutosavedForm({ type: "toggleLegacyCheckbox", name, checked, value });
		}
	}, []);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		const eventId = eventIdRef.current;
		if (!ticketId || !eventId || isSubmitting) {
			if (!ticketId || !eventId) {
				showAlert(t.incompleteFormAlert, "warning");
				router.push("/");
			}
			return;
		}

		dispatchFormPage({ type: "submitStarted" });
		try {
			const registrationData = {
				eventId,
				ticketId,
				formData: {
					...formData
				},
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
				router.push(window.location.href.replace("/form", "/success"));
			} else {
				throw new Error(result.message || "Registration failed");
			}
		} catch (error) {
			showAlert(t.registrationFailedAlert + (error instanceof Error ? error.message : "Unknown error"), "error");
			dispatchFormPage({ type: "submitFailed" });
		}
	}

	useEffect(() => {
		async function initForm() {
			try {
				const storedData = localStorage.getItem(formDataStorageKey) || localStorage.getItem(legacyFormDataStorageKey);
				if (!storedData) {
					showAlert(t.noTicketAlert, "warning");
					dispatchFormPage({ type: "loadFailed", error: t.noTicketAlert });
					return;
				}

				const parsedData = JSON.parse(storedData);
				dispatchFormPage({ type: "ticketLoaded", ticketId: parsedData.ticketId });
				eventIdRef.current = parsedData.eventId;
				dispatchAutosavedForm({ type: "setReferralCode", referralCode: parsedData.referralCode || "" });
				invitationCodeRef.current = parsedData.invitationCode || "";

				const ticketResponse = await ticketsAPI.getTicket(parsedData.ticketId);
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

				if (isTicketExpired(ticket)) {
					showAlert(t.ticketSaleEnded, "error");
					dispatchFormPage({ type: "loadFailed", error: t.ticketSaleEnded });
					return;
				}

				if (isTicketNotYetAvailable(ticket)) {
					showAlert(t.ticketNotYetAvailable, "warning");
					dispatchFormPage({ type: "loadFailed", error: t.ticketNotYetAvailable });
					return;
				}

				if (isTicketSoldOut(ticket)) {
					showAlert(t.ticketSoldOut, "error");
					dispatchFormPage({ type: "loadFailed", error: t.ticketSoldOut });
					return;
				}

				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error(formFieldsData.message || "Failed to load form fields");
				}
				const processedFields = normalizeTicketFormFields(formFieldsData.data || [], parsedData.eventId);

				dispatchFormPage({ type: "formLoaded", formFields: processedFields });
			} catch (error) {
				console.error("Failed to initialize form:", error);
				dispatchFormPage({ type: "loadFailed", error: error instanceof Error ? error.message : "Unknown error" });
			}
		}

		void initForm();
	}, [showAlert, t.noTicketAlert, t.ticketSaleEnded, t.ticketNotYetAvailable, t.ticketSoldOut, isTicketExpired, isTicketNotYetAvailable, isTicketSoldOut]);

	useEffect(() => {
		if (!autosaveKey || !autosaveRestoredRef.current) return;

		const dataToSave = {
			formData,
			referralCode,
			agreeToTerms,
			savedAt: Date.now()
		};

		localStorage.setItem(autosaveKey, JSON.stringify(dataToSave));
	}, [autosaveKey, formData, referralCode, agreeToTerms]);

	useEffect(() => {
		if (!autosaveKey || loading || autosaveRestoredRef.current) return;

		try {
			const savedData = localStorage.getItem(autosaveKey);
			if (savedData) {
				const parsed = JSON.parse(savedData);

				const twentyFourHours = 24 * 60 * 60 * 1000;
				if (parsed.savedAt && Date.now() - parsed.savedAt < twentyFourHours) {
					let hasRestoredData = false;
					const restoredValues: Partial<AutosavedFormState> = {};

					if (parsed.formData && Object.keys(parsed.formData).length > 0) {
						restoredValues.formData = parsed.formData;
						hasRestoredData = true;
					}
					if (parsed.referralCode) {
						restoredValues.referralCode = parsed.referralCode;
						hasRestoredData = true;
					}
					if (parsed.agreeToTerms !== undefined) {
						restoredValues.agreeToTerms = parsed.agreeToTerms;
						hasRestoredData = true;
					}

					if (hasRestoredData) {
						dispatchAutosavedForm({ type: "restore", values: restoredValues });
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
	}, [autosaveKey, loading, showAlert, t.autosaveRestored]);

	const visibleFields = useMemo(() => {
		if (!ticketId) return formFields;

		return formFields.filter(field =>
			shouldDisplayField(
				field,
				{
					selectedTicketId: ticketId,
					formData,
					currentTime: new Date()
				},
				formFields
			)
		);
	}, [formFields, ticketId, formData]);

	return (
		<RegistrationFormView
			t={t}
			loading={loading}
			error={error}
			pathname={pathname}
			verifyHref={verifyHref}
			visibleFields={visibleFields}
			formData={formData}
			referralCode={referralCode}
			agreeToTerms={agreeToTerms}
			isSubmitting={isSubmitting}
			onBack={() => router.push(pathname.replace("/form", ""))}
			onSubmit={handleSubmit}
			onTextChange={handleTextChange}
			onCheckboxChange={handleCheckboxChange}
			dispatchAutosavedForm={dispatchAutosavedForm}
		/>
	);
}
