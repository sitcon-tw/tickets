"use client";

import { FormField } from "@/components/form/FormField";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
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
	const [isCancelling, setIsCancelling] = useState(false);

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
			"zh-Hant": "載入失敗：",
			"zh-Hans": "载入失败：",
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
			"zh-Hant": "儲存失敗：",
			"zh-Hans": "保存失败：",
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
		},
		cancelRegistration: {
			"zh-Hant": "取消報名",
			"zh-Hans": "取消报名",
			en: "Cancel Registration"
		},
		cancelConfirm: {
			"zh-Hant": "確定要取消此報名嗎？",
			"zh-Hans": "确定要取消此报名吗？",
			en: "Are you sure you want to cancel this registration?"
		},
		cancelling: {
			"zh-Hant": "取消中...",
			"zh-Hans": "取消中...",
			en: "Cancelling..."
		},
		cancelSuccess: {
			"zh-Hant": "報名已成功取消",
			"zh-Hans": "报名已成功取消",
			en: "Registration cancelled successfully"
		},
		cancelFailed: {
			"zh-Hant": "取消失敗：",
			"zh-Hans": "取消失败：",
			en: "Failed to cancel: "
		},
		cannotCancel: {
			"zh-Hant": "此報名無法取消",
			"zh-Hans": "此报名无法取消",
			en: "This registration cannot be cancelled"
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

	async function handleSave() {
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
	}

	function handleCancelEdit() {
		if (registration) {
			setFormData(registration.formData as FormDataType);
		}
		setIsEditing(false);
	}

	async function handleCancelRegistration() {
		if (!registration || !registration.canCancel) {
			showAlert(t.cannotCancel, "warning");
			return;
		}

		if (!confirm(t.cancelConfirm)) {
			return;
		}

		setIsCancelling(true);
		try {
			const result = await registrationsAPI.cancel(registrationId);

			if (result.success) {
				showAlert(t.cancelSuccess, "success");
				setRegistration({ ...registration, status: "cancelled", canEdit: false, canCancel: false });
			} else {
				throw new Error(result.message || "Failed to cancel registration");
			}
		} catch (error) {
			console.error("Cancel error:", error);
			showAlert(t.cancelFailed + (error instanceof Error ? error.message : "Unknown error"), "error");
		} finally {
			setIsCancelling(false);
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleString(locale, {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit"
		});
	}

	useEffect(() => {
		async function loadRegistration() {
			try {
				const session = await authAPI.getSession();
				if (!session || !session.user) {
					const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
					router.push(`/login/?returnUrl=${returnUrl}`);
					return;
				}

				if (!registrationId) {
					setError(t.notFound);
					setLoading(false);
					return;
				}

				const regResponse = await registrationsAPI.getById(registrationId);
				if (!regResponse.success) {
					throw new Error(regResponse.message || t.notFound);
				}

				const regData = regResponse.data;
				setRegistration(regData);

				if (regData.ticketId) {
					const fieldsResponse = await ticketsAPI.getFormFields(regData.ticketId);
					if (fieldsResponse.success) {
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

	return (
		<>
			<main>
				<section className="mt-24 max-w-[900px] mx-auto px-4 mb-16">
					<Button variant="outline" onClick={() => router.back()} className="mb-8">
						<ChevronLeft />
						<p>{t.backToRegistrations}</p>
					</Button>
					<h1 className="my-4 text-[2.5rem]">{t.myRegistration}</h1>{" "}
					{loading && (
						<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70">
							<PageSpinner />
							<p>{t.loading}</p>
						</div>
					)}
					{error && (
						<div className="text-center p-8">
							<p className="text-red-500">
								{t.loadFailed}
								{error}
							</p>
							<Link href="/">{t.backToRegistrations}</Link>
						</div>
					)}
					{!loading && !error && registration && (
						<div className="flex flex-col gap-8">
							{/* Event Information - Read Only */}
							<div className="p-6 border border-(--border-color) rounded-lg bg-(--background-secondary)">
								<h2 className="mb-4 text-2xl">{t.eventInfo}</h2>
								<div className="flex flex-col gap-3">
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
							<div className="p-6 border border-(--border-color) rounded-lg bg-(--background-secondary)">
								<h2 className="mb-4 text-2xl">{t.ticketInfo}</h2>
								<div className="flex flex-col gap-3">
									<div>
										<strong>{t.ticketType}:</strong> {getLocalizedText(registration.ticket?.name || {}, locale)}
									</div>
									<div>
										<strong>{t.ticketPrice}:</strong> {registration.ticket?.price === 0 ? t.free : `$${registration.ticket?.price}`}
									</div>
									<div>
										<strong>{t.registrationStatus}:</strong>{" "}
										<span className={registration.status === "confirmed" ? "text-green-500" : registration.status === "cancelled" ? "text-red-500" : "text-orange-500"}>
											{registration.status === "confirmed"
												? t.statusConfirmed
												: registration.status === "cancelled"
													? t.statusCancelled
													: registration.status === "pending"
														? t.statusPending
														: registration.status}
										</span>
									</div>
									<div>
										<strong>{t.registeredAt}:</strong> {formatDate(registration.createdAt)}
									</div>
								</div>
							</div>

							{/* Cancel Registration Button */}
							{registration.canCancel && registration.status !== "cancelled" && (
								<div className="flex justify-center">
									<Button variant="destructive" onClick={handleCancelRegistration} disabled={isCancelling || isEditing}>
										{isCancelling ? <Spinner size="sm" /> : <X size={18} />}
										{isCancelling ? t.cancelling : t.cancelRegistration}
									</Button>
								</div>
							)}

							{/* Registration Form Data - Editable */}
							<div className="p-6 border border-(--border-color) rounded-lg">
								<div className="flex justify-between items-center mb-4">
									<h2 className="text-2xl">{t.registrationInfo}</h2>
									{!isEditing && registration.canEdit && (
										<Button onClick={() => setIsEditing(true)} size="sm">
											{t.edit}
										</Button>
									)}
								</div>

								{!registration.canEdit && <p className="text-(--text-secondary) mb-4 text-sm">{t.cannotEdit}</p>}

								<div className="flex flex-col gap-6">
									{formFields.map((field, index) => {
										const fieldName = getLocalizedText(field.name, locale);
										const fieldId = field.id;

										if (isEditing) {
											return (
												<FormField
													key={fieldId}
													field={field}
													value={formData[fieldId] || ""}
													onTextChange={handleTextChange}
													onCheckboxChange={handleCheckboxChange}
													pleaseSelectText={t.pleaseSelect}
												/>
											);
										} else {
											// Display as read-only
											const value = formData[fieldId];
											let displayValue: string;

											if (Array.isArray(value)) {
												displayValue = value.join(", ");
											} else if (typeof value === "boolean") {
												displayValue = value ? "✓" : "✗";
											} else {
												displayValue = String(value || "-");
											}

											return (
												<div key={fieldId}>
													<div className="font-bold mb-1">{fieldName}</div>
													<div className="p-2 bg-(--background-secondary) rounded min-h-10 flex items-center">{displayValue}</div>
												</div>
											);
										}
									})}
								</div>

								{isEditing && (
									<div className="flex gap-4 mt-8 justify-center">
										<Button onClick={handleSave} disabled={isSaving}>
											{isSaving ? <Spinner size="sm" /> : <Save size={18} />}
											{isSaving ? t.saving : t.save}
										</Button>
										<Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
											<X size={18} />
											{t.cancel}
										</Button>
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
