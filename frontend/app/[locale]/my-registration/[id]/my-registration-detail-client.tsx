"use client";

import { FormField } from "@/components/form/FormField";
import PageSpinner from "@/components/PageSpinner";
import Spinner from "@/components/Spinner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { useRouter } from "@/i18n/navigation";
import { registrationsAPI, ticketsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import { formatDateTime } from "@/lib/utils/timezone";
import { FieldFilter, LocalizedText, Registration, TicketFormField } from "@sitcontix/types";
import { ChevronLeft, ChevronRight, ExternalLink, Save, X } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect, useReducer } from "react";

type FormDataType = {
	[key: string]: string | boolean | string[];
};

type RegistrationDetailState = {
	loading: boolean;
	error: string | null;
	registration: Registration | null;
	formFields: TicketFormField[];
	formData: FormDataType;
	isEditing: boolean;
	isSaving: boolean;
	isCancelling: boolean;
};

type RegistrationDetailAction =
	| { type: "loadFailed"; error: string }
	| { type: "loaded"; registration: Registration; formFields: TicketFormField[]; formData: FormDataType }
	| { type: "fieldChanged"; name: string; value: string | boolean | string[] }
	| { type: "toggleCheckboxValue"; name: string; checked: boolean; value: string }
	| { type: "editStarted" }
	| { type: "editCancelled" }
	| { type: "saveStarted" }
	| { type: "saveFinished" }
	| { type: "saveSucceeded"; formData: Record<string, unknown> }
	| { type: "cancelStarted" }
	| { type: "cancelFinished" }
	| { type: "cancelSucceeded" };

function registrationDetailReducer(state: RegistrationDetailState, action: RegistrationDetailAction): RegistrationDetailState {
	switch (action.type) {
		case "loadFailed":
			return { ...state, loading: false, error: action.error };
		case "loaded":
			return {
				...state,
				loading: false,
				error: null,
				registration: action.registration,
				formFields: action.formFields,
				formData: action.formData
			};
		case "fieldChanged":
			return { ...state, formData: { ...state.formData, [action.name]: action.value } };
		case "toggleCheckboxValue": {
			const currentValues = Array.isArray(state.formData[action.name]) ? (state.formData[action.name] as string[]) : [];
			const nextValues = action.checked ? [...currentValues, action.value] : currentValues.filter(v => v !== action.value);
			return { ...state, formData: { ...state.formData, [action.name]: nextValues } };
		}
		case "editStarted":
			return { ...state, isEditing: true };
		case "editCancelled":
			return { ...state, isEditing: false, formData: (state.registration?.formData as FormDataType) || {} };
		case "saveStarted":
			return { ...state, isSaving: true };
		case "saveFinished":
			return { ...state, isSaving: false };
		case "saveSucceeded":
			return state.registration
				? {
						...state,
						isEditing: false,
						registration: { ...state.registration, formData: action.formData },
						formData: action.formData as FormDataType
					}
				: state;
		case "cancelStarted":
			return { ...state, isCancelling: true };
		case "cancelFinished":
			return { ...state, isCancelling: false };
		case "cancelSucceeded":
			return state.registration
				? {
						...state,
						registration: { ...state.registration, status: "cancelled", canEdit: false, canCancel: false }
					}
				: state;
		default:
			return state;
	}
}

function formatDate(date: Date | null | undefined) {
	if (!date) return "N/A";
	return formatDateTime(date);
}

const registrationDetailTranslations = {
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
	backToSuccessPage: {
		"zh-Hant": "返回報名成功頁面",
		"zh-Hans": "返回报名成功页面",
		en: "Back to Registration Success Page"
	},
	goToSuccessPage: {
		"zh-Hant": "前往報名成功頁面",
		"zh-Hans": "前往报名成功页面",
		en: "Go to Registration Success Page"
	},
	backToRegistrations: {
		"zh-Hant": "返回我的報名列表",
		"zh-Hans": "返回我的报名列表",
		en: "Back to My Registrations"
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
	cancelCancelRegistration: {
		"zh-Hant": "算了",
		"zh-Hans": "算了",
		en: "Never mind"
	},
	cancelConfirm: {
		"zh-Hant": "確定要取消此報名嗎？您將無法再次編輯或恢復此報名。",
		"zh-Hans": "确定要取消此报名吗？您将无法再次编辑或恢复此报名。",
		en: "Are you sure you want to cancel this registration? You will not be able to edit or recover this registration again."
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
};

type RegistrationDetailTranslations = Record<string, string>;

function RegistrationSummaryCards({ registration, locale, t }: { registration: Registration; locale: string; t: RegistrationDetailTranslations }) {
	return (
		<>
			<div className="p-6 border-2 border-gray-500 rounded-lg bg-(--background-secondary)">
				<h2 className="mb-4 text-2xl">{t.eventInfo}</h2>
				<div className="flex flex-col gap-3">
					<div>
						<strong>{t.eventName}:</strong> {getLocalizedText(registration.event?.name || {}, locale)}
					</div>
					{getLocalizedText(registration.event?.locationText, locale) && (
						<div className="flex items-center gap-3">
							<strong>{t.eventLocation}:</strong>
							{registration.event?.mapLink ? (
								<a href={registration.event?.mapLink} target="_blank" rel="noopener noreferrer" className="text-base hover:underline text-blue-500 dark:text-blue-400 flex items-center">
									{getLocalizedText(registration.event?.locationText, locale)}
									<ExternalLink size={16} className="ml-1" />
								</a>
							) : (
								<span className="text-base">{getLocalizedText(registration.event?.locationText, locale)}</span>
							)}
						</div>
					)}
					<div>
						<strong>{t.eventTime}:</strong> {formatDate(registration.event?.startDate)} - {formatDate(registration.event?.endDate)}
					</div>
				</div>
			</div>

			<div className="p-6 border-2 border-gray-500 rounded-lg bg-(--background-secondary)">
				<h2 className="mb-4 text-2xl">{t.ticketInfo}</h2>
				<div className="flex flex-col gap-3">
					<div>
						<strong>{t.ticketType}:</strong> {getLocalizedText(registration.ticket?.name || {}, locale)}
					</div>
					<div>
						<strong>{t.ticketPrice}:</strong> {registration.ticket?.price === 0 ? t.free : `${registration.ticket?.price}`}
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
		</>
	);
}

function RegistrationFormSection({
	registration,
	formFields,
	formData,
	isEditing,
	locale,
	t,
	onEdit,
	editActions,
	cancelAction,
	onTextChange,
	onCheckboxChange
}: {
	registration: Registration;
	formFields: TicketFormField[];
	formData: FormDataType;
	isEditing: boolean;
	locale: string;
	t: RegistrationDetailTranslations;
	onEdit: () => void;
	editActions: React.ReactNode;
	cancelAction: React.ReactNode;
	onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
	onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<>
			<div className="p-6 border-2 border-gray-500 rounded-lg">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl">{t.registrationInfo}</h2>
					{!isEditing && registration.canEdit && (
						<Button onClick={onEdit} size="sm">
							{t.edit}
						</Button>
					)}
				</div>
				{!registration.canEdit && <p className="text-(--text-secondary) mb-4 text-sm">{t.cannotEdit}</p>}
				<div className="flex flex-col gap-6">
					{formFields.map(field => {
						const fieldName = getLocalizedText(field.name, locale);
						const fieldId = field.id;
						if (isEditing) {
							return <FormField key={fieldId} field={field} value={formData[fieldId] || ""} onTextChange={onTextChange} onCheckboxChange={onCheckboxChange} pleaseSelectText={t.pleaseSelect} />;
						}
						const value = formData[fieldId];
						const displayValue = Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value || "-");
						return (
							<div key={fieldId}>
								<div className="font-bold mb-1">{fieldName}</div>
								<div className="p-2 bg-(--background-secondary) rounded min-h-10 flex items-center">{displayValue}</div>
							</div>
						);
					})}
				</div>
				{isEditing && <div className="flex gap-4 mt-8 justify-center">{editActions}</div>}
			</div>
			{registration.canCancel && registration.status !== "cancelled" && <div className="flex justify-center">{cancelAction}</div>}
		</>
	);
}

function MyRegistrationPageContent() {
	const router = useRouter();
	const locale = useLocale();
	const { showAlert } = useAlert();
	const params = useParams();
	const searchParams = useSearchParams();
	const isFromMyRegistrations = searchParams.get("h") != null;
	const registrationId = params?.id as string;

	const [{ loading, error, registration, formFields, formData, isEditing, isSaving, isCancelling }, dispatchRegistrationDetail] = useReducer(registrationDetailReducer, {
		loading: true,
		error: null,
		registration: null,
		formFields: [],
		formData: {},
		isEditing: false,
		isSaving: false,
		isCancelling: false
	});

	const t = getTranslations(locale, registrationDetailTranslations);

	const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		dispatchRegistrationDetail({ type: "fieldChanged", name, value });
	}, []);

	const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, checked } = e.target;

		if (value === "true") {
			dispatchRegistrationDetail({ type: "fieldChanged", name, value: checked });
		} else if (checked && value !== "true") {
			const values = value === "" ? [] : value.split(",").filter(v => v.trim() !== "");
			dispatchRegistrationDetail({ type: "fieldChanged", name, value: values });
		} else {
			dispatchRegistrationDetail({ type: "toggleCheckboxValue", name, checked, value });
		}
	}, []);

	async function handleSave() {
		if (!registration || !registration.canEdit) {
			showAlert(t.cannotEdit, "warning");
			return;
		}

		dispatchRegistrationDetail({ type: "saveStarted" });
		try {
			const result = await registrationsAPI.update(registrationId, { formData });

			if (result.success) {
				showAlert(t.saveSuccess, "success");
				dispatchRegistrationDetail({ type: "saveSucceeded", formData: result.data.formData as Record<string, unknown> });
			} else {
				throw new Error(result.message || "Failed to update registration");
			}
		} catch (error) {
			console.error("Save error:", error);
			showAlert(t.saveFailed + (error instanceof Error ? error.message : "Unknown error"), "error");
		} finally {
			dispatchRegistrationDetail({ type: "saveFinished" });
		}
	}

	function handleCancelEdit() {
		dispatchRegistrationDetail({ type: "editCancelled" });
	}

	async function handleCancelRegistration() {
		if (!registration || !registration.canCancel) {
			showAlert(t.cannotCancel, "warning");
			return;
		}

		dispatchRegistrationDetail({ type: "cancelStarted" });
		try {
			const result = await registrationsAPI.cancel(registrationId);

			if (result.success) {
				showAlert(t.cancelSuccess, "success");
				dispatchRegistrationDetail({ type: "cancelSucceeded" });
			} else {
				throw new Error(result.message || "Failed to cancel registration");
			}
		} catch (error) {
			console.error("Cancel error:", error);
			showAlert(t.cancelFailed + (error instanceof Error ? error.message : "Unknown error"), "error");
		} finally {
			dispatchRegistrationDetail({ type: "cancelFinished" });
		}
	}

	useEffect(() => {
		async function loadRegistration() {
			try {
				if (!registrationId) {
					dispatchRegistrationDetail({ type: "loadFailed", error: t.notFound });
					return;
				}

				const regResponse = await registrationsAPI.getById(registrationId);
				if (!regResponse.success) {
					throw new Error(regResponse.message || t.notFound);
				}

				const regData = regResponse.data;
				let processedFields: TicketFormField[] = [];

				if (regData.ticketId) {
					const fieldsResponse = await ticketsAPI.getFormFields(regData.ticketId);
					if (fieldsResponse.success) {
						processedFields = (fieldsResponse.data || []).map(field => {
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
							const originalStr = typeof description === "string" ? description : "";
							if (typeof description === "string" && description.startsWith("{")) {
								try {
									description = JSON.parse(description);
								} catch {
									description = { en: originalStr };
								}
							} else if (typeof description === "string") {
								description = { en: description };
							}

							const options = (field.options || []).map((opt: unknown): Record<string, string> => {
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
								eventId: regData.eventId,
								type: field.type as "text" | "textarea" | "select" | "checkbox" | "radio",
								name,
								description: description as LocalizedText | undefined,
								options,
								filters: field.filters as FieldFilter | null | undefined,
								prompts: field.prompts as Record<string, string[]> | null | undefined
							};
						});
					}
				}

				dispatchRegistrationDetail({
					type: "loaded",
					registration: regData,
					formFields: processedFields,
					formData: regData.formData as FormDataType
				});
			} catch (error) {
				console.error("Failed to load registration:", error);
				dispatchRegistrationDetail({ type: "loadFailed", error: error instanceof Error ? error.message : "Unknown error" });
			}
		}

		loadRegistration();
	}, [registrationId, router, t.notFound]);

	return (
		<>
			<main>
				<section className="mt-24 md:mt-32 max-w-[900px] mx-auto px-4 mb-16">
					{isFromMyRegistrations ? (
						<div className="flex gap-4 mb-4">
							<Button variant="secondary" onClick={() => router.push(`/my-registration`)}>
								<ChevronLeft />
								<p>{t.backToRegistrations}</p>
							</Button>
							<Button variant="secondary" onClick={() => router.push(registration?.event?.slug ? `/${registration?.event?.slug}/success` : `/${registration?.eventId.slice(-6)}/success`)}>
								<p>{t.goToSuccessPage}</p>
								<ChevronRight />
							</Button>
						</div>
					) : (
						<Button variant="secondary" onClick={() => router.push(registration?.event?.slug ? `/${registration?.event?.slug}/success` : `/${registration?.eventId.slice(-6)}/success`)}>
							<ChevronLeft />
							<p>{t.backToSuccessPage}</p>
						</Button>
					)}
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
							<RegistrationSummaryCards registration={registration} locale={locale} t={t} />
							<RegistrationFormSection
								registration={registration}
								formFields={formFields}
								formData={formData}
								isEditing={isEditing}
								locale={locale}
								t={t}
								onEdit={() => dispatchRegistrationDetail({ type: "editStarted" })}
								editActions={
									<>
										<Button onClick={handleSave} disabled={isSaving}>
											{isSaving ? <Spinner size="sm" /> : <Save size={18} />}
											{isSaving ? t.saving : t.save}
										</Button>
										<Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
											<X size={18} />
											{t.cancel}
										</Button>
									</>
								}
								cancelAction={
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button variant="destructive" disabled={isCancelling || isEditing}>
												{isCancelling ? <Spinner size="sm" /> : <X size={18} />}
												{isCancelling ? t.cancelling : t.cancelRegistration}
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>{t.cancelRegistration}</AlertDialogTitle>
												<AlertDialogDescription>{t.cancelConfirm}</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>{t.cancelCancelRegistration}</AlertDialogCancel>
												<AlertDialogAction onClick={handleCancelRegistration}>{t.cancelRegistration}</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								}
								onTextChange={handleTextChange}
								onCheckboxChange={handleCheckboxChange}
							/>
						</div>
					)}
				</section>
			</main>
		</>
	);
}

export default function MyRegistrationPage() {
	return (
		<Suspense
			fallback={
				<main>
					<section className="mt-24 md:mt-32 max-w-[900px] mx-auto px-4 mb-16">
						<div className="flex flex-col items-center justify-center gap-4 p-12 opacity-70">
							<PageSpinner />
						</div>
					</section>
				</main>
			}
		>
			<MyRegistrationPageContent />
		</Suspense>
	);
}
