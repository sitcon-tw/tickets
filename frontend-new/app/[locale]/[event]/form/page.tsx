"use client";

import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { FormField } from "@/components/form/FormField";
import Text from "@/components/input/Text";
import Checkbox from "@/components/input/Checkbox";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { TicketFormField } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { ChevronLeft } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/contexts/AlertContext";

type FormDataType = {
	[key: string]: string | boolean | string[];
};

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
			"zh-Hant": "報名失敗: ",
			"zh-Hans": "报名失败: ",
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
			"zh-Hant": "載入表單失敗: ",
			"zh-Hans": "载入表单失败: ",
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
		},
	});

	// Form data handlers
	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === "true") {
			// Single checkbox
			setFormData(prev => ({ ...prev, [name]: checked }));
		} else {
			// Multiple checkbox options
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

	// Initialize form
	useEffect(() => {
		async function initForm() {
			try {
				// Check auth
				const session = await authAPI.getSession();
				if (!session || !session.user) {
					router.push("/login/");
					return;
				}

				// Load form data from localStorage
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

				// Load ticket info to check if it requires invite code
				const ticketResponse = await ticketsAPI.getTicket(parsedData.ticketId);
				if (!ticketResponse.success) {
					throw new Error(ticketResponse.message || "Failed to load ticket information");
				}

				const ticket = ticketResponse.data;
				setRequiresInviteCode(ticket.requireInviteCode || false);

				// Load form fields from ticket API
				const formFieldsData = await ticketsAPI.getFormFields(parsedData.ticketId);
				if (!formFieldsData.success) {
					throw new Error(formFieldsData.message || "Failed to load form fields");
				}

				// Process form fields to fix malformed data from backend
				const processedFields = (formFieldsData.data || []).map(field => {
					// Fix name if it's stringified
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

					// Fix description if it's a JSON string
					let description = field.description;
					if (typeof description === "string" && description.startsWith("{")) {
						try {
							const parsed = JSON.parse(description);
							description = parsed.en || parsed[Object.keys(parsed)[0]] || description;
						} catch {
							// Keep original if parse fails
						}
					}

					// Fix options to flatten label objects
					const options = (field.values || field.options || []).map((opt: unknown): Record<string, string> => {
						if (typeof opt === "object" && opt !== null && "label" in opt) {
							// Option has a label object, flatten it
							const optWithLabel = opt as { label: unknown };
							const labelValue = typeof optWithLabel.label === "object" && optWithLabel.label !== null && "en" in optWithLabel.label ? (optWithLabel.label as { en?: string }).en || Object.values(optWithLabel.label as Record<string, unknown>)[0] : optWithLabel.label;
							return { en: String(labelValue) };
						}
						if (typeof opt === "object" && opt !== null) {
							return opt as Record<string, string>;
						}
						return { en: String(opt) };
					});

					return {
						...field,
						name,
						description,
						options
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
	}, [router, t.noTicketAlert]);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
				// Clear stored data
				localStorage.removeItem("formData");
				// Redirect to success page
				router.push(window.location.href.replace("/form", "/success"));
			} else {
				throw new Error(result.message || "Registration failed");
			}
		} catch (error) {
			console.error("Registration error:", error);
			showAlert(t.registrationFailedAlert + (error instanceof Error ? error.message : "Unknown error"), "error");
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Nav />
			<main>
				<section
					style={{
						marginTop: "6rem",
						maxWidth: "800px",
						marginLeft: "auto",
						marginRight: "auto",
						padding: "0 1rem"
					}}
				>
					<button onClick={() => router.back()} className="button" style={{ marginBottom: "2rem" }}>
						<div className="flex items-center">
							<ChevronLeft />
							<p>{t.reselectTicket}</p>
						</div>
					</button>
					<h1
						style={{
							marginBlock: "1rem",
							fontSize: "2.5rem"
						}}
					>
						{t.fillForm}
					</h1>

					{loading && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								gap: "1rem",
								padding: "3rem",
								opacity: 0.7
							}}
						>
							<PageSpinner size={48} />
							<p>{t.loadingForm}</p>
						</div>
					)}

					{error && (
						<div style={{ textAlign: "center", padding: "2rem" }}>
							<p style={{ color: "red" }}>
								{t.loadFormFailed}
								{error}
							</p>
							<Link href="/">{t.backToHome}</Link>
						</div>
					)}

					{!loading && !error && (
						<form
							onSubmit={handleSubmit}
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "1.5rem"
							}}
						>
							{/* Invitation code field - shown if ticket requires it */}
							{requiresInviteCode && <Text label={`${t.invitationCode} *`} id="invitationCode" value={invitationCode} onChange={e => setInvitationCode(e.target.value)} required={requiresInviteCode} placeholder={t.invitationCode} />}

							{/* Dynamic form fields from API */}
							{formFields.map((field, index) => {
								const fieldName = getLocalizedText(field.name, locale);
								return <FormField key={index} field={field} value={formData[fieldName] || ""} onTextChange={handleTextChange} onCheckboxChange={handleCheckboxChange} pleaseSelectText={t.pleaseSelect} />;
							})}

							{/* Referral code field - always shown and editable */}
							<Text label={t.referralCodeOptional} id="referralCode" value={referralCode} required={false} onChange={e => setReferralCode(e.target.value)} placeholder={t.referralCode} />

							{/* Terms and conditions checkbox */}
							<div>
								<Checkbox label={t.agreeToTerms} question={t.agreeToTermsQuestion} value={agreeToTerms} required id="agreeToTerms" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} />
								<a href={`/${locale}/terms`} target="_blank" rel="noreferrer" className="underline" style={{ marginTop: "0.5rem", marginLeft: "2rem" }}>{t.termsLink}</a>
							</div>

							<button
								type="submit"
								className="button"
								disabled={isSubmitting}
								style={{
									cursor: isSubmitting ? "not-allowed" : "pointer",
									marginTop: "2rem",
									alignSelf: "center",
									opacity: isSubmitting ? 0.7 : 1,
									transition: "opacity 0.2s",
									display: "inline-flex",
									alignItems: "center",
									gap: "0.5rem",
									pointerEvents: isSubmitting ? "none" : "auto"
								}}
							>
								{isSubmitting && <Spinner size="sm" />}
								{t.submitRegistration}
							</button>
						</form>
					)}
				</section>
			</main>
			<Footer />
		</>
	);
}
