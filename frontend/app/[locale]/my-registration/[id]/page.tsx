"use client";

import { FormField } from "@/components/form/FormField";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { authAPI, registrationsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { Registration, TicketFormField } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { ChevronLeft, Save, X } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useAlert } from "@/contexts/AlertContext";

type FormDataType = {
	[key: string]: string | boolean | string[];
};

export default function MyRegistrationPage() {
	const router = useRouter();
	const locale = useLocale();
	const { showAlert } = useAlert();
	const params = useParams();
	const registrationId = params?.id as string;

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [registration, setRegistration] = useState<Registration | null>(null);
	const [formFields, setFormFields] = useState<TicketFormField[]>([]);
	const [formData, setFormData] = useState<FormDataType>({});
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const t = getTranslations(locale, {
		myRegistration: {
			"zh-Hant": "我的報名",
			"zh-Hans": "我的报名",
			en: "My Registration"
		},
		loading: {
			"zh-Hant": "載入中...",
			"zh-Hans": "载入中...",
			en: "Loading..."
		},
		loadFailed: {
			"zh-Hant": "載入失敗: ",
			"zh-Hans": "载入失败: ",
			en: "Failed to load: "
		},
		backToRegistrations: {
			"zh-Hant": "返回報名成功頁面",
			"zh-Hans": "返回报名成功页面",
			en: "Back to Registration Success Page"
		},
		eventInfo: {
			"zh-Hant": "活動資訊",
			"zh-Hans": "活动资讯",
			en: "Event Information"
		},
		eventName: {
			"zh-Hant": "活動名稱",
			"zh-Hans": "活动名称",
			en: "Event Name"
		},
		eventLocation: {
			"zh-Hant": "活動地點",
			"zh-Hans": "活动地点",
			en: "Event Location"
		},
		eventTime: {
			"zh-Hant": "活動時間",
			"zh-Hans": "活动时间",
			en: "Event Time"
		},
		ticketInfo: {
			"zh-Hant": "票券資訊",
			"zh-Hans": "票券资讯",
			en: "Ticket Information"
		},
		ticketType: {
			"zh-Hant": "票種",
			"zh-Hans": "票种",
			en: "Ticket Type"
		},
		ticketPrice: {
			"zh-Hant": "價格",
			"zh-Hans": "价格",
			en: "Price"
		},
		registrationStatus: {
			"zh-Hant": "報名狀態",
			"zh-Hans": "报名状态",
			en: "Registration Status"
		},
		statusConfirmed: {
			"zh-Hant": "已確認",
			"zh-Hans": "已确认",
			en: "Confirmed"
		},
		statusCancelled: {
			"zh-Hant": "已取消",
			"zh-Hans": "已取消",
			en: "Cancelled"
		},
		statusPending: {
			"zh-Hant": "待處理",
			"zh-Hans": "待处理",
			en: "Pending"
		},
		registrationInfo: {
			"zh-Hant": "報名資料",
			"zh-Hans": "报名资料",
			en: "Registration Information"
		},
		edit: {
			"zh-Hant": "編輯",
			"zh-Hans": "编辑",
			en: "Edit"
		},
		cancel: {
			"zh-Hant": "取消",
			"zh-Hans": "取消",
			en: "Cancel"
		},
		save: {
			"zh-Hant": "儲存",
			"zh-Hans": "保存",
			en: "Save"
		},
		saving: {
			"zh-Hant": "儲存中...",
			"zh-Hans": "保存中...",
			en: "Saving..."
		},
		saveSuccess: {
			"zh-Hant": "儲存成功！",
			"zh-Hans": "保存成功！",
			en: "Saved successfully!"
		},
		saveFailed: {
			"zh-Hant": "儲存失敗: ",
			"zh-Hans": "保存失败: ",
			en: "Failed to save: "
		},
		cannotEdit: {
			"zh-Hant": "此報名無法編輯",
			"zh-Hans": "此报名无法编辑",
			en: "This registration cannot be edited"
		},
		pleaseSelect: {
			"zh-Hant": "請選擇...",
			"zh-Hans": "请选择...",
			en: "Please select..."
		},
		notFound: {
			"zh-Hant": "找不到報名記錄",
			"zh-Hans": "找不到报名记录",
			en: "Registration not found"
		},
		registeredAt: {
			"zh-Hant": "報名時間",
			"zh-Hans": "报名时间",
			en: "Registered At"
		},
		free: {
			"zh-Hant": "免費",
			"zh-Hans": "免费",
			en: "Free"
		}
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

	// Load registration data
	useEffect(() => {
		async function loadRegistration() {
			try {
				// Check auth
				const session = await authAPI.getSession();
				if (!session || !session.user) {
					router.push("/login/");
					return;
				}

				if (!registrationId) {
					setError(t.notFound);
					setLoading(false);
					return;
				}

				// Load registration
				const regResponse = await registrationsAPI.getById(registrationId);
				if (!regResponse.success) {
					throw new Error(regResponse.message || t.notFound);
				}

				const regData = regResponse.data;
				setRegistration(regData);

				// Load form fields for this ticket
				if (regData.ticketId) {
					const fieldsResponse = await ticketsAPI.getFormFields(regData.ticketId);
					if (fieldsResponse.success) {
						// Process form fields similar to form page
						const processedFields = (fieldsResponse.data || []).map(field => {
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
								} catch {
									// Keep original if parse fails
								}
							}

							const options = (field.values || field.options || []).map((opt: unknown): Record<string, string> => {
								if (typeof opt === "object" && opt !== null && "label" in opt) {
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
					}
				}

				// Set form data from registration
				setFormData(regData.formData as FormDataType);

				setLoading(false);
			} catch (error) {
				console.error("Failed to load registration:", error);
				setError(error instanceof Error ? error.message : "Unknown error");
				setLoading(false);
			}
		}

		loadRegistration();
	}, [registrationId, router, t.notFound]);

	// Handle save
	const handleSave = async () => {
		if (!registration || !registration.canEdit) {
			showAlert(t.cannotEdit, "warning");
			return;
		}

		setIsSaving(true);
		try {
			const result = await registrationsAPI.update(registrationId, { formData });

			if (result.success) {
				showAlert(t.saveSuccess, "success");
				setRegistration({ ...registration, formData: result.data.formData as Record<string, unknown> });
				setIsEditing(false);
			} else {
				throw new Error(result.message || "Failed to update registration");
			}
		} catch (error) {
			console.error("Save error:", error);
			showAlert(t.saveFailed + (error instanceof Error ? error.message : "Unknown error"), "error");
		} finally {
			setIsSaving(false);
		}
	};

	// Handle cancel edit
	const handleCancelEdit = () => {
		if (registration) {
			setFormData(registration.formData as FormDataType);
		}
		setIsEditing(false);
	};

	// Format date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString(locale, {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	};

	return (
		<>
			<main>
				<section
					style={{
						marginTop: "6rem",
						maxWidth: "900px",
						marginLeft: "auto",
						marginRight: "auto",
						padding: "0 1rem",
						marginBottom: "4rem"
					}}
				>
					<button onClick={() => router.back()} className="button" style={{ marginBottom: "2rem" }}>
						<div className="flex items-center">
							<ChevronLeft />
							<p>{t.backToRegistrations}</p>
						</div>
					</button>

					<h1
						style={{
							marginBlock: "1rem",
							fontSize: "2.5rem"
						}}
					>
						{t.myRegistration}
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
							<p>{t.loading}</p>
						</div>
					)}

					{error && (
						<div style={{ textAlign: "center", padding: "2rem" }}>
							<p style={{ color: "red" }}>
								{t.loadFailed}
								{error}
							</p>
							<Link href="/">{t.backToRegistrations}</Link>
						</div>
					)}

					{!loading && !error && registration && (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "2rem"
							}}
						>
							{/* Event Information - Read Only */}
							<div
								style={{
									padding: "1.5rem",
									border: "1px solid var(--border-color)",
									borderRadius: "8px",
									backgroundColor: "var(--background-secondary)"
								}}
							>
								<h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>{t.eventInfo}</h2>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
									<div>
										<strong>{t.eventName}:</strong> {getLocalizedText(registration.event?.name || {}, locale)}
									</div>
									{registration.event?.location && (
										<div>
											<strong>{t.eventLocation}:</strong> {registration.event.location}
										</div>
									)}
									<div>
										<strong>{t.eventTime}:</strong> {formatDate(registration.event?.startDate || "")} - {formatDate(registration.event?.endDate || "")}
									</div>
								</div>
							</div>

							{/* Ticket Information - Read Only */}
							<div
								style={{
									padding: "1.5rem",
									border: "1px solid var(--border-color)",
									borderRadius: "8px",
									backgroundColor: "var(--background-secondary)"
								}}
							>
								<h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>{t.ticketInfo}</h2>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
									<div>
										<strong>{t.ticketType}:</strong> {getLocalizedText(registration.ticket?.name || {}, locale)}
									</div>
									<div>
										<strong>{t.ticketPrice}:</strong> {registration.ticket?.price === 0 ? t.free : `$${registration.ticket?.price}`}
									</div>
									<div>
										<strong>{t.registrationStatus}:</strong>{" "}
										<span
											style={{
												color: registration.status === "confirmed" ? "green" : registration.status === "cancelled" ? "red" : "orange"
											}}
										>
											{registration.status === "confirmed" ? t.statusConfirmed : registration.status === "cancelled" ? t.statusCancelled : registration.status === "pending" ? t.statusPending : registration.status}
										</span>
									</div>
									<div>
										<strong>{t.registeredAt}:</strong> {formatDate(registration.createdAt)}
									</div>
								</div>
							</div>

							{/* Registration Form Data - Editable */}
							<div
								style={{
									padding: "1.5rem",
									border: "1px solid var(--border-color)",
									borderRadius: "8px"
								}}
							>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
									<h2 style={{ fontSize: "1.5rem" }}>{t.registrationInfo}</h2>
									{!isEditing && registration.canEdit && (
										<button onClick={() => setIsEditing(true)} className="button" style={{ padding: "0.5rem 1rem" }}>
											{t.edit}
										</button>
									)}
								</div>

								{!registration.canEdit && <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.9rem" }}>{t.cannotEdit}</p>}

								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: "1.5rem"
									}}
								>
									{formFields.map((field, index) => {
										const fieldName = getLocalizedText(field.name, locale);

										if (isEditing) {
											return <FormField key={index} field={field} value={formData[fieldName] || ""} onTextChange={handleTextChange} onCheckboxChange={handleCheckboxChange} pleaseSelectText={t.pleaseSelect} />;
										} else {
											// Display as read-only
											const value = formData[fieldName];
											let displayValue: string;

											if (Array.isArray(value)) {
												displayValue = value.join(", ");
											} else if (typeof value === "boolean") {
												displayValue = value ? "✓" : "✗";
											} else {
												displayValue = String(value || "-");
											}

											return (
												<div key={index}>
													<div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{fieldName}</div>
													<div
														style={{
															padding: "0.5rem",
															backgroundColor: "var(--background-secondary)",
															borderRadius: "4px",
															minHeight: "2.5rem",
															display: "flex",
															alignItems: "center"
														}}
													>
														{displayValue}
													</div>
												</div>
											);
										}
									})}
								</div>

								{isEditing && (
									<div
										style={{
											display: "flex",
											gap: "1rem",
											marginTop: "2rem",
											justifyContent: "center"
										}}
									>
										<button
											onClick={handleSave}
											disabled={isSaving}
											className="button"
											style={{
												cursor: isSaving ? "not-allowed" : "pointer",
												opacity: isSaving ? 0.7 : 1,
												display: "inline-flex",
												alignItems: "center",
												gap: "0.5rem"
											}}
										>
											{isSaving ? <Spinner size="sm" /> : <Save size={18} />}
											{isSaving ? t.saving : t.save}
										</button>
										<button
											onClick={handleCancelEdit}
											disabled={isSaving}
											className="button"
											style={{
												cursor: isSaving ? "not-allowed" : "pointer",
												opacity: isSaving ? 0.7 : 1,
												display: "inline-flex",
												alignItems: "center",
												gap: "0.5rem"
											}}
										>
											<X size={18} />
											{t.cancel}
										</button>
									</div>
								)}
							</div>
						</div>
					)}
				</section>
			</main>
		</>
	);
}
