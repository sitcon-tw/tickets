"use client";

import { FormField } from "@/components/form/FormField";
import Checkbox from "@/components/input/Checkbox";
import Text from "@/components/input/Text";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { usePathname, useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { LocalizedText, TicketFormField } from "@/lib/types/api";
import type { FormDataType } from "@/lib/types/data";
import { shouldDisplayField } from "@/lib/utils/filterEvaluation";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function FormPage() {
	const router = useRouter();
	const locale = useLocale();
	const pathname = usePathname();
	const { showAlert } = useAlert();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formFields, setFormFields] = useState<TicketFormField[]>([]);
	const [formData, setFormData] = useState<FormDataType>({});
	const [ticketId, setTicketId] = useState<string | null>(null);
	const [eventId, setEventId] = useState<string | null>(null);
	const [invitationCode, setInvitationCode] = useState<string>("");
	const [referralCode, setReferralCode] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [agreeToTerms, setAgreeToTerms] = useState(false);

	const t = getTranslations(locale, {
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
		}
	});

	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === "true") {
			// Single checkbox (boolean value)
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else if (checked && value !== "true") {
			// Multi-checkbox with comma-separated values
			// When checked is true and value is not "true", this is from MultiCheckbox
			// The value contains the comma-separated list (or empty string if all unchecked)
			const values = value === "" ? [] : value.split(",").filter(v => v.trim() !== "");
			setFormData(prev => ({ ...prev, [name]: values }));
		} else {
			// Single checkbox with a specific value (legacy support)
			setFormData(prev => {
				const currentValues = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
				if (checked) {
					return { ...prev, [name]: [...currentValues, value] };
				} else {
					return { ...prev, [name]: currentValues.filter(v => v !== value) };
				}
			});
		}
	}, []);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();

		if (!ticketId || !eventId || isSubmitting) {
			if (!ticketId || !eventId) {
				showAlert(t.incompleteFormAlert, "warning");
				router.push("/");
			}
			return;
		}

		setIsSubmitting(true);
		try {
			const registrationData = {
				eventId,
				ticketId,
				formData: {
					...formData
				},
				invitationCode: invitationCode.trim() || undefined,
				referralCode: referralCode.trim() || undefined
			};

			const result = await registrationsAPI.create(registrationData);

			if (result.success) {
				localStorage.removeItem("formData");
				localStorage.removeItem("referralCode");
				localStorage.removeItem("invitationCode");
				router.push(window.location.href.replace("/form", "/success"));
			} else {
				throw new Error(result.message || "Registration failed");
			}
		} catch (error) {
			showAlert(t.registrationFailedAlert + (error instanceof Error ? error.message : "Unknown error"), "error");
			setIsSubmitting(false);
		}
	}

	useEffect(() => {
		async function initForm() {
			try {
				const session = await authAPI.getSession();
				if (!session || !session.user) {
					const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
					router.push(`/login/?returnUrl=${returnUrl}`);
					return;
				}

				const storedData = localStorage.getItem("formData");
				if (!storedData) {
					showAlert(t.noTicketAlert, "warning");
					router.push("/");
					return;
				}

				const parsedData = JSON.parse(storedData);
				setTicketId(parsedData.ticketId);
				setEventId(parsedData.eventId);
				setReferralCode(parsedData.referralCode || "");
				setInvitationCode(parsedData.invitationCode || "");

				const ticketResponse = await ticketsAPI.getTicket(parsedData.ticketId);
				if (!ticketResponse.success) {
					throw new Error(ticketResponse.message || "Failed to load ticket information");
				}

				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error(formFieldsData.message || "Failed to load form fields");
				}
				const processedFields = (formFieldsData.data || []).map(field => {
					let name: LocalizedText = field.name;
					if (typeof name === "string" && name === "[object Object]") {
						name = { en: typeof field.description === "string" ? field.description : "field" };
					} else if (typeof name === "string") {
						try {
							name = JSON.parse(name);
						} catch {
							name = { en: name.toString() };
						}
					}

					let description: LocalizedText | string | undefined = field.description as any;
					if (typeof description === "string" && description.startsWith("{")) {
						const originalStr = description;
						try {
							description = JSON.parse(description);
						} catch {
							// If parsing fails, convert string to LocalizedText
							description = { en: originalStr };
						}
					} else if (typeof description === "string") {
						// Convert plain string to LocalizedText
						description = { en: description };
					}

					const options = (field.values || field.options || []).map((opt: unknown): Record<string, string> => {
						if (typeof opt === "object" && opt !== null && "label" in opt) {
							const optWithLabel = opt as { label: unknown };
							const labelValue =
								typeof optWithLabel.label === "object" && optWithLabel.label !== null && "en" in optWithLabel.label
									? (optWithLabel.label as { en?: string }).en || Object.values(optWithLabel.label as Record<string, unknown>)[0]
									: optWithLabel.label;
							return { en: String(labelValue) };
						}
						if (typeof opt === "object" && opt !== null) {
							return opt as Record<string, string>;
						}
						return { en: String(opt) };
					});

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
						name,
						description: description as LocalizedText | undefined,
						options,
						filters
					};
				});

				setFormFields(processedFields);
				setLoading(false);
			} catch (error) {
				console.error("Failed to initialize form:", error);
				setError(error instanceof Error ? error.message : "Unknown error");
				setLoading(false);
			}
		}

		initForm();
	}, [router, showAlert, t.noTicketAlert]);

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
		<>
			<main className="mt-32">
				<section className="max-w-3xl mx-auto p-16 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
					<Button variant="secondary" onClick={() => router.push(pathname.replace("/form", ""))}>
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
							<p className="text-red-600">
								{t.loadFormFailed}
								{error}
							</p>
							<Link href="/">{t.backToHome}</Link>
						</div>
					)}

					{!loading && !error && (
						<form onSubmit={handleSubmit} className="flex flex-col gap-6">
							{visibleFields.map(field => (
								<FormField key={field.id} field={field} value={formData[field.id] || ""} onTextChange={handleTextChange} onCheckboxChange={handleCheckboxChange} pleaseSelectText={t.pleaseSelect} />
							))}

							<Text label={t.referralCodeOptional} id="referralCode" value={referralCode} required={false} onChange={e => setReferralCode(e.target.value)} placeholder={t.referralCode} />

							<div>
								<div className="flex items-center space-x-2">
									<Checkbox id="agreeToTerms" required checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} label={t.agreeToTerms} />
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
		</>
	);
}
