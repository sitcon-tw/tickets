export const campaignTranslations = {
	title: { "zh-Hant": "郵件發送", en: "Email Campaigns" },
	description: {
		"zh-Hant": "撰寫郵件、預覽收件人並批次發送給報名者",
		en: "Compose emails, preview recipients and send them to attendees in bulk"
	},
	createNew: { "zh-Hant": "建立新郵件", en: "Create Campaign" },
	refresh: { "zh-Hant": "重新整理", en: "Refresh" },
	loadFailed: { "zh-Hant": "載入郵件任務失敗", en: "Failed to load campaigns" },
	retry: { "zh-Hant": "重試", en: "Retry" },
	name: { "zh-Hant": "名稱", en: "Name" },
	subject: { "zh-Hant": "主旨", en: "Subject" },
	status: { "zh-Hant": "狀態", en: "Status" },
	recipients: { "zh-Hant": "收件人", en: "Recipients" },
	createdAt: { "zh-Hant": "建立時間", en: "Created" },
	actions: { "zh-Hant": "操作", en: "Actions" },
	preview: { "zh-Hant": "預覽", en: "Preview" },
	send: { "zh-Hant": "發送", en: "Send" },
	cancel: { "zh-Hant": "取消", en: "Cancel" },
	cancelCampaign: { "zh-Hant": "取消任務", en: "Cancel campaign" },
	close: { "zh-Hant": "關閉", en: "Close" },
	save: { "zh-Hant": "儲存為草稿", en: "Save as draft" },
	content: { "zh-Hant": "內容 (HTML)", en: "Content (HTML)" },
	edit: { "zh-Hant": "編輯", en: "Edit" },
	contentPreview: { "zh-Hant": "內容預覽", en: "Content preview" },
	contentPreviewHint: { "zh-Hant": "此為原始內容預覽，變數尚未替換。", en: "Raw content preview; variables are not replaced yet." },
	contentEmpty: { "zh-Hant": "尚未輸入內容", en: "No content yet" },
	targetAudience: { "zh-Hant": "目標受眾", en: "Target Audience" },
	selectEvents: { "zh-Hant": "篩選活動（不選則全部）", en: "Filter by event (leave empty for all)" },
	selectTickets: { "zh-Hant": "篩選票種（不選則全部）", en: "Filter by ticket (leave empty for all)" },
	registrationStatusFilter: { "zh-Hant": "報名狀態篩選（不選則預設已確認）", en: "Registration status (defaults to confirmed if none selected)" },
	noEvents: { "zh-Hant": "沒有活動", en: "No events" },
	noTickets: { "zh-Hant": "沒有票種", en: "No tickets" },
	noTicketsForEvents: { "zh-Hant": "所選活動沒有票種", en: "The selected events have no tickets" },
	confirmed: { "zh-Hant": "已確認", en: "Confirmed" },
	pending: { "zh-Hant": "待處理", en: "Pending" },
	cancelled: { "zh-Hant": "已取消", en: "Cancelled" },
	draft: { "zh-Hant": "草稿", en: "Draft" },
	sent: { "zh-Hant": "已發送", en: "Sent" },
	sending: { "zh-Hant": "發送中", en: "Sending" },
	all: { "zh-Hant": "全部", en: "All" },
	previewRecipients: { "zh-Hant": "預覽收件人", en: "Preview recipients" },
	recipientCountLabel: { "zh-Hant": "符合條件的收件人", en: "Matching recipients" },
	recipientCountHint: { "zh-Hant": "發送前會再次計算實際收件人。", en: "Recipients are calculated again right before sending." },
	viewRecipients: { "zh-Hant": "查看名單", en: "View list" },
	recipientList: { "zh-Hant": "收件人名單", en: "Recipient list" },
	currentlyMatching: { "zh-Hant": "目前符合條件", en: "Currently matching" },
	currentlyMatchingHint: {
		"zh-Hant": "此名單依目前的報名資料計算，並非實際寄送紀錄。",
		en: "Based on current registrations, not a record of who was actually emailed."
	},
	noMatchingRecipients: { "zh-Hant": "無符合收件人", en: "No matching recipients" },
	emailPreview: { "zh-Hant": "郵件預覽", en: "Email preview" },
	insertVar: {
		"zh-Hant": "點擊插入變數（另可使用 {{formData.欄位代碼}}）",
		en: "Click to insert a variable (you can also use {{formData.fieldKey}})"
	},
	importTemplate: { "zh-Hant": "匯入模板", en: "Import template" },
	templates: { "zh-Hant": "郵件模板", en: "Email templates" },
	noTemplates: { "zh-Hant": "沒有可用模板", en: "No templates available" },
	importTemplateOverwrite: { "zh-Hant": "匯入模板會取代目前輸入的內容。", en: "Importing a template replaces the current content." },
	namePlaceholder: { "zh-Hant": "2026 SITCON 大會通知", en: "2026 SITCON conference notice" },
	subjectPlaceholder: { "zh-Hant": "【SITCON 2026】活動通知", en: "[SITCON 2026] Event notice" },
	nameHelp: { "zh-Hant": "僅供內部辨識，收件人看不到。", en: "Internal label, recipients never see it." },
	requiredFields: { "zh-Hant": "請填寫名稱、主旨和內容", en: "Please fill in the name, subject and content" },
	calcFailed: { "zh-Hant": "計算收件人失敗", en: "Failed to calculate recipients" },
	createSuccess: { "zh-Hant": "郵件草稿已建立", en: "Campaign draft created" },
	createFailed: { "zh-Hant": "建立失敗", en: "Failed to create campaign" },
	previewFailed: { "zh-Hant": "預覽失敗", en: "Preview failed" },
	sendConfirmTitle: { "zh-Hant": "確認發送郵件？", en: "Send this campaign?" },
	sendConfirmDesc: {
		"zh-Hant": "將把「{name}」發送給 {count} 位收件人。發送後無法收回或重複發送。",
		en: "“{name}” will be sent to {count} recipient(s). This cannot be undone or sent again."
	},
	sendConfirmLabel: { "zh-Hant": "發送給 {count} 位收件人", en: "Send to {count} recipient(s)" },
	noRecipients: { "zh-Hant": "沒有符合條件的收件人，無法發送", en: "No matching recipients, nothing to send" },
	sendStarted: { "zh-Hant": "「{name}」開始發送，共 {count} 封", en: "Sending “{name}” to {count} recipient(s)" },
	sendDone: { "zh-Hant": "「{name}」發送完成，已發送 {count} 封", en: "“{name}” sent: {count} email(s) delivered" },
	sendDonePartial: {
		"zh-Hant": "「{name}」發送完成，成功 {count} 封，失敗 {failed} 封",
		en: "“{name}” finished: {count} sent, {failed} failed"
	},
	sendReset: { "zh-Hant": "「{name}」發送失敗，已重置為草稿", en: "Sending “{name}” failed and was reset to draft" },
	sendFailed: { "zh-Hant": "發送失敗", en: "Failed to send" },
	cancelConfirmTitle: { "zh-Hant": "取消此郵件任務？", en: "Cancel this campaign?" },
	cancelConfirmDesc: {
		"zh-Hant": "「{name}」將被標記為已取消，之後無法再發送。",
		en: "“{name}” will be marked as cancelled and can no longer be sent."
	},
	keep: { "zh-Hant": "保留", en: "Keep it" },
	cancelSuccess: { "zh-Hant": "已取消", en: "Campaign cancelled" },
	cancelFailed: { "zh-Hant": "取消失敗", en: "Failed to cancel" },
	estimatedRecipients: { "zh-Hant": "預估 {count} 位", en: "~{count} recipients" },
	failedCount: { "zh-Hant": "{count} 失敗", en: "{count} failed" },
	sendingDisabled: { "zh-Hant": "發送中，無法操作", en: "Sending in progress" },
	emptyTitle: { "zh-Hant": "還沒有郵件任務", en: "No campaigns yet" },
	emptyDescription: {
		"zh-Hant": "建立第一封郵件，選擇收件人後發送給報名者。",
		en: "Create your first email, pick the recipients and send it to attendees."
	},
	emptyFiltered: { "zh-Hant": "此狀態下沒有郵件任務", en: "No campaigns with this status" },
	varEmail: { "zh-Hant": "收件人 Email", en: "Recipient email" },
	varName: { "zh-Hant": "姓名", en: "Name" },
	varEventName: { "zh-Hant": "活動名稱", en: "Event name" },
	varEventDate: { "zh-Hant": "活動開始日期", en: "Event start date" },
	varEventEndDate: { "zh-Hant": "活動結束日期", en: "Event end date" },
	varEventLocation: { "zh-Hant": "活動地點", en: "Event location" },
	varTicketName: { "zh-Hant": "票種名稱", en: "Ticket name" },
	varTicketPrice: { "zh-Hant": "票價", en: "Ticket price" },
	varRegistrationId: { "zh-Hant": "報名 ID", en: "Registration ID" }
};

export type CampaignTranslations = Record<string, string>;

/** Replaces `{key}` placeholders in a translated string. */
export function fmt(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
