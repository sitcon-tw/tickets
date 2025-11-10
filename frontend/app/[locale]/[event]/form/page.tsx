"use client";

import { FormField } from "@/components/form/FormField";
import Checkbox from "@/components/input/Checkbox";
import Text from "@/components/input/Text";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { TicketFormField } from "@/lib/types/api";
import type { FormDataType } from "@/lib/types/data";
import { shouldDisplayField } from "@/lib/utils/filterEvaluation";
import { getLocalizedText } from "@/lib/utils/localization";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function FormPage() {
	const router = useRouter();
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [formFields, setFormFields] = useState<TicketFormField[]>([]);
	const [formData, setFormData] = useState<FormDataType>({});
	const [ticketId, setTicketId] = useState<string | null>(null);
	const [eventId, setEventId] = useState<string | null>(null);
	const [invitationCode, setInvitationCode] = useState<string>("");
	const [referralCode, setReferralCode] = useState<string>("");
	const [requiresInviteCode, setRequiresInviteCode] = useState<boolean>(false);
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
			"zh-Hans": "我已阅读并同意服务条款",
			en: "I have read and agree to the terms"
		},
		termsLink: {
			"zh-Hant": "服務條款與隱私政策連結",
			"zh-Hans": "服务条款与隐私政策链接",
			en: "Terms and Privacy Policy link"
		}
	});

	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === "true") {
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
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

				const ticket = ticketResponse.data;
				setRequiresInviteCode(ticket.requireInviteCode || false);

				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error(formFieldsData.message || "Failed to load form fields");
				}
				const processedFields = (formFieldsData.data || []).map(field => {
					let name = field.name;
					if (typeof name === "string" && name === "[object Object]") {
						name = { en: field.description || "field" };
					} else if (typeof name === "string") {
						try {
							name = JSON.parse(name);
						} catch {
							name = { en: name.toString() };
						}
					}

					let description = field.description;
					if (typeof description === "string" && description.startsWith("{")) {
						try {
							const parsed = JSON.parse(description);
							description = parsed.en || parsed[Object.keys(parsed)[0]] || description;
						} catch {}
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

					// Parse filters if they're a string
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
						description,
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

	// Filter visible fields based on conditions
	const visibleFields = useMemo(() => {
		if (!ticketId) return formFields;

		const filtered = formFields.filter(field => {
			const shouldDisplay = shouldDisplayField(
				field,
				{
					selectedTicketId: ticketId,
					formData: formData,
					currentTime: new Date()
				},
				formFields // Pass all fields for field-based condition evaluation
			);

			// Debug logging
			if (field.filters?.enabled) {
				console.log("Field filter evaluation:", {
					fieldName: typeof field.name === "object" ? field.name.en : field.name,
					filters: field.filters,
					shouldDisplay,
					ticketId,
					formData
				});
			}

			return shouldDisplay;
		});

		return filtered;
	}, [formFields, ticketId, formData]);

	return (
		<>
			<main>
				<section className="mt-24 max-w-3xl mx-auto px-4">
					<Button variant="outline" onClick={() => router.back()} className="mb-8">
						<ChevronLeft />
						<p>{t.reselectTicket}</p>
					</Button>
					<h1 className="my-4 text-4xl">{t.fillForm}</h1>

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
							{/* Invitation code field - shown if ticket requires it */}
							{requiresInviteCode && (
								<Text
									label={`${t.invitationCode} *`}
									id="invitationCode"
									value={invitationCode}
									onChange={e => setInvitationCode(e.target.value)}
									required={requiresInviteCode}
									placeholder={t.invitationCode}
								/>
							)}

							{/* Dynamic form fields from API - filtered by display conditions */}
							{visibleFields.map((field, index) => {
								const fieldName = getLocalizedText(field.name, locale);
								return (
									<FormField key={index} field={field} value={formData[fieldName] || ""} onTextChange={handleTextChange} onCheckboxChange={handleCheckboxChange} pleaseSelectText={t.pleaseSelect} />
								);
							})}

							{/* Referral code field - always shown and editable */}
							<Text label={t.referralCodeOptional} id="referralCode" value={referralCode} required={false} onChange={e => setReferralCode(e.target.value)} placeholder={t.referralCode} />

							{/* Terms and conditions checkbox */}
							<div>
								<Checkbox
									label={t.agreeToTerms}
									question={t.agreeToTermsQuestion}
									value={agreeToTerms}
									required
									id="agreeToTerms"
									checked={agreeToTerms}
									onChange={e => setAgreeToTerms(e.target.checked)}
								/>
								<a href={`/${locale}/terms`} target="_blank" rel="noreferrer" className="underline mt-2 ml-8">
									{t.termsLink}
								</a>
							</div>

							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Spinner size="sm" />}
								{t.submitRegistration}
							</Button>
						</form>
					)}
				</section>
			</main>
		</>
	);
}
