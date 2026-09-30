export const webhookTranslations = {
	title: { "zh-Hant": "Webhook 設定", "zh-Hans": "Webhook 设置", en: "Webhook Settings" },
	description: {
		"zh-Hant": "設定 Webhook，在報名確認或取消時自動通知您的系統",
		"zh-Hans": "设置 Webhook，在报名确认或取消时自动通知您的系统",
		en: "Configure a webhook to notify your system when registrations are confirmed or cancelled"
	},
	noWebhook: { "zh-Hant": "尚未設定 Webhook", "zh-Hans": "尚未设置 Webhook", en: "No webhook configured" },
	noWebhookDesc: {
		"zh-Hant": "建立 Webhook 以在報名狀態變更時自動通知您的系統。每個活動可設定一個 Webhook。",
		"zh-Hans": "创建 Webhook 以在报名状态变更时自动通知您的系统。每个活动可设置一个 Webhook。",
		en: "Create a webhook to automatically notify your system when registration status changes. Each event can have one webhook."
	},
	selectEvent: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Please select an event first" },
	selectEventDesc: {
		"zh-Hant": "Webhook 是依活動設定的，請從側邊欄選擇活動。",
		"zh-Hans": "Webhook 是按活动设置的，请从侧边栏选择活动。",
		en: "Webhooks are configured per event. Choose an event from the sidebar."
	},
	loadFailed: { "zh-Hant": "無法載入 Webhook 設定", "zh-Hans": "无法载入 Webhook 设置", en: "Failed to load webhook settings" },
	createWebhook: { "zh-Hant": "建立 Webhook", "zh-Hans": "创建 Webhook", en: "Create Webhook" },
	editWebhook: { "zh-Hant": "編輯 Webhook", "zh-Hans": "编辑 Webhook", en: "Edit Webhook" },
	editDialogDesc: {
		"zh-Hant": "變更後會立即套用於之後的通知。",
		"zh-Hans": "变更后会立即应用于之后的通知。",
		en: "Changes apply to all notifications sent from now on."
	},
	createDialogDesc: {
		"zh-Hant": "填寫接收通知的網址，並選擇要接收的事件。",
		"zh-Hans": "填写接收通知的网址，并选择要接收的事件。",
		en: "Enter the URL that should receive notifications and choose which events to send."
	},
	endpoint: { "zh-Hant": "接收端點", "zh-Hans": "接收端点", en: "Endpoint" },
	webhookUrl: { "zh-Hant": "Webhook 網址", "zh-Hans": "Webhook 网址", en: "Webhook URL" },
	webhookUrlPlaceholder: { "zh-Hant": "https://your-server.com/webhook", "zh-Hans": "https://your-server.com/webhook", en: "https://your-server.com/webhook" },
	webhookUrlHelp: {
		"zh-Hant": "必須使用 HTTPS。我們會以 POST 傳送 JSON，您的伺服器需回應 HTTP 200，否則視為失敗。",
		"zh-Hans": "必须使用 HTTPS。我们会以 POST 发送 JSON，您的服务器需响应 HTTP 200，否则视为失败。",
		en: "Must use HTTPS. We POST JSON to this URL and your server must reply with HTTP 200, otherwise the delivery counts as failed."
	},
	urlRequired: { "zh-Hant": "請輸入 Webhook 網址", "zh-Hans": "请输入 Webhook 网址", en: "Please enter a webhook URL" },
	urlInvalid: { "zh-Hant": "網址格式不正確", "zh-Hans": "网址格式不正确", en: "This is not a valid URL" },
	urlNotHttps: { "zh-Hant": "網址必須以 https:// 開頭", "zh-Hans": "网址必须以 https:// 开头", en: "The URL must start with https://" },
	authHeader: { "zh-Hant": "認證標頭", "zh-Hans": "认证标头", en: "Auth Header" },
	optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
	authHeaderHelp: {
		"zh-Hant": "每次請求都會帶上此標頭，方便您的伺服器驗證來源。",
		"zh-Hans": "每次请求都会带上此标头，方便您的服务器验证来源。",
		en: "Sent with every request so your server can verify where it came from."
	},
	authHeaderName: { "zh-Hant": "標頭名稱", "zh-Hans": "标头名称", en: "Header name" },
	authHeaderNamePlaceholder: { "zh-Hant": "X-Sitcontix-Token", "zh-Hans": "X-Sitcontix-Token", en: "X-Sitcontix-Token" },
	authHeaderValue: { "zh-Hant": "標頭值（密鑰）", "zh-Hans": "标头值（密钥）", en: "Header value (secret)" },
	authHeaderValuePlaceholder: { "zh-Hant": "your-secret-token", "zh-Hans": "your-secret-token", en: "your-secret-token" },
	authHeaderValueKeepPlaceholder: { "zh-Hant": "保持不變（重新輸入以更換）", "zh-Hans": "保持不变（重新输入以更换）", en: "Unchanged (type to replace)" },
	authHeaderEditHelp: {
		"zh-Hant": "為了安全，已儲存的密鑰不會再顯示。留空表示保持不變；清空標頭名稱即可移除認證標頭。",
		"zh-Hans": "为了安全，已保存的密钥不会再显示。留空表示保持不变；清空标头名称即可移除认证标头。",
		en: "For security the stored secret is never shown again. Leave the value empty to keep it; clear the header name to remove the header."
	},
	headerNameInvalid: {
		"zh-Hant": "標頭名稱只能包含英數字與 ! # $ % & ' * + - . ^ _ ` | ~",
		"zh-Hans": "标头名称只能包含英数字与 ! # $ % & ' * + - . ^ _ ` | ~",
		en: "Header names may only contain letters, digits and ! # $ % & ' * + - . ^ _ ` | ~"
	},
	headerNameReserved: { "zh-Hant": "此標頭名稱為系統保留，請改用其他名稱", "zh-Hans": "此标头名称为系统保留，请改用其他名称", en: "This header name is reserved, please use another one" },
	headerNameTooLong: { "zh-Hant": "標頭名稱不可超過 128 個字元", "zh-Hans": "标头名称不可超过 128 个字符", en: "The header name must not exceed 128 characters" },
	headerValueInvalid: { "zh-Hant": "標頭值只能包含 ASCII 可見字元", "zh-Hans": "标头值只能包含 ASCII 可见字符", en: "The header value may only contain printable ASCII characters" },
	headerValueTooLong: { "zh-Hant": "標頭值不可超過 512 個字元", "zh-Hans": "标头值不可超过 512 个字符", en: "The header value must not exceed 512 characters" },
	headerNameRequired: { "zh-Hant": "請輸入標頭名稱，或清空標頭值", "zh-Hans": "请输入标头名称，或清空标头值", en: "Enter a header name, or clear the header value" },
	headerValueRequired: { "zh-Hant": "請輸入標頭值，或清空標頭名稱", "zh-Hans": "请输入标头值，或清空标头名称", en: "Enter a header value, or clear the header name" },
	headerValueRequiredOnRename: {
		"zh-Hant": "更改標頭名稱時，需要重新輸入標頭值（已儲存的密鑰無法沿用）",
		"zh-Hans": "更改标头名称时，需要重新输入标头值（已保存的密钥无法沿用）",
		en: "Re-enter the header value when renaming the header (the stored secret cannot be reused)"
	},
	showSecret: { "zh-Hant": "顯示標頭值", "zh-Hans": "显示标头值", en: "Show header value" },
	hideSecret: { "zh-Hant": "隱藏標頭值", "zh-Hans": "隐藏标头值", en: "Hide header value" },
	secretStored: { "zh-Hant": "密鑰已加密儲存，無法再次檢視", "zh-Hans": "密钥已加密保存，无法再次查看", en: "Secret is stored and cannot be viewed again" },
	eventTypes: { "zh-Hant": "事件類型", "zh-Hans": "事件类型", en: "Event Types" },
	eventTypesHelp: { "zh-Hant": "只有勾選的事件會被傳送到此端點。", "zh-Hans": "只有勾选的事件会被发送到此端点。", en: "Only the selected events are sent to this endpoint." },
	eventTypesRequired: { "zh-Hant": "請至少選擇一種事件類型", "zh-Hans": "请至少选择一种事件类型", en: "Select at least one event type" },
	registrationConfirmed: { "zh-Hant": "報名確認", "zh-Hans": "报名确认", en: "Registration Confirmed" },
	registrationConfirmedDesc: {
		"zh-Hant": "報名成功並確認後傳送，內容包含報名者資料、票種與表單填寫內容。",
		"zh-Hans": "报名成功并确认后发送，内容包含报名者资料、票种与表单填写内容。",
		en: "Sent when a registration is confirmed. Includes the attendee, ticket and submitted form data."
	},
	registrationCancelled: { "zh-Hant": "報名取消", "zh-Hans": "报名取消", en: "Registration Cancelled" },
	registrationCancelledDesc: {
		"zh-Hant": "報名被取消時傳送，內容包含報名編號、取消時間與驗證 token。",
		"zh-Hans": "报名被取消时发送，内容包含报名编号、取消时间与验证 token。",
		en: "Sent when a registration is cancelled. Includes the registration ID, cancellation time and verification token."
	},
	status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
	active: { "zh-Hant": "啟用中", "zh-Hans": "启用中", en: "Active" },
	inactive: { "zh-Hant": "已停用", "zh-Hans": "已停用", en: "Disabled" },
	failing: { "zh-Hant": "傳送異常", "zh-Hans": "发送异常", en: "Failing" },
	autoDisabled: { "zh-Hant": "已自動停用", "zh-Hans": "已自动停用", en: "Auto-disabled" },
	autoDisabledDesc: {
		"zh-Hant": "此 Webhook 因連續多個時段傳送失敗而被自動停用。修正接收端後，請重新啟用。",
		"zh-Hans": "此 Webhook 因连续多个时段发送失败而被自动停用。修复接收端后，请重新启用。",
		en: "This webhook was disabled automatically after failing for several consecutive periods. Fix your endpoint, then enable it again."
	},
	failingDesc: {
		"zh-Hant": "最近的通知傳送失敗（自 {date} 起）。若持續失敗，系統會自動停用此 Webhook。",
		"zh-Hans": "最近的通知发送失败（自 {date} 起）。若持续失败，系统会自动停用此 Webhook。",
		en: "Recent deliveries are failing (since {date}). The webhook will be disabled automatically if this continues."
	},
	enabled: { "zh-Hant": "啟用 Webhook", "zh-Hans": "启用 Webhook", en: "Webhook enabled" },
	toggleHelpOn: { "zh-Hant": "停用後將不再傳送通知", "zh-Hans": "停用后将不再发送通知", en: "Turn off to stop sending notifications" },
	toggleHelpOff: { "zh-Hant": "啟用後會重置失敗計數", "zh-Hans": "启用后会重置失败计数", en: "Turning on resets the failure counter" },
	testWebhook: { "zh-Hant": "傳送測試", "zh-Hans": "发送测试", en: "Send test" },
	testHint: {
		"zh-Hant": "會傳送包含範例資料的測試通知。編輯時若未輸入標頭值，測試不會帶上已儲存的密鑰。",
		"zh-Hans": "会发送包含示例数据的测试通知。编辑时若未输入标头值，测试不会带上已保存的密钥。",
		en: "Sends a sample notification. When editing, the stored secret is not included in the test unless you re-enter it."
	},
	testSuccess: { "zh-Hant": "測試成功", "zh-Hans": "测试成功", en: "Test successful" },
	testFailed: { "zh-Hant": "測試失敗", "zh-Hans": "测试失败", en: "Test failed" },
	testError: { "zh-Hant": "無法執行測試", "zh-Hans": "无法执行测试", en: "Could not run the test" },
	responseBody: { "zh-Hant": "回應內容", "zh-Hans": "响应内容", en: "Response body" },
	statusCode: { "zh-Hant": "狀態碼", "zh-Hans": "状态码", en: "Status code" },
	errorMessage: { "zh-Hant": "錯誤訊息", "zh-Hans": "错误信息", en: "Error message" },
	save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
	cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
	delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
	deleteWebhook: { "zh-Hant": "刪除 Webhook", "zh-Hans": "删除 Webhook", en: "Delete Webhook" },
	deleteConfirm: {
		"zh-Hant": "確定要刪除此 Webhook 嗎？之後將不再傳送任何通知，且此操作無法復原。",
		"zh-Hans": "确定要删除此 Webhook 吗？之后将不再发送任何通知，且此操作无法恢复。",
		en: "Are you sure you want to delete this webhook? No more notifications will be sent and this cannot be undone."
	},
	saved: { "zh-Hant": "Webhook 已更新", "zh-Hans": "Webhook 已更新", en: "Webhook updated" },
	created: { "zh-Hant": "Webhook 已建立", "zh-Hans": "Webhook 已创建", en: "Webhook created" },
	deleted: { "zh-Hant": "Webhook 已刪除", "zh-Hans": "Webhook 已删除", en: "Webhook deleted" },
	enabledToast: { "zh-Hant": "Webhook 已啟用", "zh-Hans": "Webhook 已启用", en: "Webhook enabled" },
	disabledToast: { "zh-Hant": "Webhook 已停用", "zh-Hans": "Webhook 已停用", en: "Webhook disabled" },
	saveFailed: { "zh-Hant": "儲存 Webhook 失敗", "zh-Hans": "保存 Webhook 失败", en: "Failed to save webhook" },
	deleteFailed: { "zh-Hant": "刪除 Webhook 失敗", "zh-Hans": "删除 Webhook 失败", en: "Failed to delete webhook" },
	updateFailed: { "zh-Hant": "更新 Webhook 失敗", "zh-Hans": "更新 Webhook 失败", en: "Failed to update webhook" },
	copy: { "zh-Hant": "複製", "zh-Hans": "复制", en: "Copy" },
	copied: { "zh-Hant": "已複製", "zh-Hans": "已复制", en: "Copied" },
	copyFailed: { "zh-Hant": "複製失敗", "zh-Hans": "复制失败", en: "Failed to copy" },
	copyUrl: { "zh-Hant": "複製網址", "zh-Hans": "复制网址", en: "Copy URL" },
	openUrl: { "zh-Hant": "在新分頁開啟網址", "zh-Hans": "在新标签页打开网址", en: "Open URL in a new tab" },
	lastFailure: { "zh-Hant": "最近失敗時間", "zh-Hans": "最近失败时间", en: "Last failure" },
	lastUpdated: { "zh-Hant": "最後更新", "zh-Hans": "最后更新", en: "Last updated" },
	createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created" },
	none: { "zh-Hant": "無", "zh-Hans": "无", en: "None" },
	failedDeliveries: { "zh-Hant": "發送失敗紀錄", "zh-Hans": "发送失败记录", en: "Failed Deliveries" },
	failedDeliveriesDesc: {
		"zh-Hant": "已自動重試 3 次（每 5 分鐘一次）仍失敗的通知，最多顯示最近 50 筆。",
		"zh-Hans": "已自动重试 3 次（每 5 分钟一次）仍失败的通知，最多显示最近 50 条。",
		en: "Notifications that still failed after 3 automatic retries (every 5 minutes). The latest 50 are shown."
	},
	noFailedDeliveries: { "zh-Hant": "沒有失敗紀錄", "zh-Hans": "没有失败记录", en: "No failed deliveries" },
	noFailedDeliveriesDesc: { "zh-Hant": "所有通知都已成功送達。", "zh-Hans": "所有通知都已成功送达。", en: "All notifications have been delivered successfully." },
	deliveriesLoadFailed: { "zh-Hant": "無法載入失敗紀錄", "zh-Hans": "无法载入失败记录", en: "Failed to load failed deliveries" },
	refresh: { "zh-Hant": "重新整理", "zh-Hans": "刷新", en: "Refresh" },
	retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
	retrySuccess: { "zh-Hant": "重試成功", "zh-Hans": "重试成功", en: "Retry successful" },
	retryFailed: { "zh-Hant": "重試失敗，接收端仍未正常回應", "zh-Hans": "重试失败，接收端仍未正常响应", en: "Retry failed, the endpoint still did not respond correctly" },
	retryDisabledHint: { "zh-Hant": "請先啟用 Webhook 才能重試", "zh-Hans": "请先启用 Webhook 才能重试", en: "Enable the webhook to retry deliveries" },
	eventType: { "zh-Hant": "事件類型", "zh-Hans": "事件类型", en: "Event" },
	retryCount: { "zh-Hant": "重試次數", "zh-Hans": "重试次数", en: "Retries" },
	time: { "zh-Hant": "時間", "zh-Hans": "时间", en: "Time" },
	actions: { "zh-Hant": "動作", "zh-Hans": "操作", en: "Actions" },
	required: { "zh-Hant": "必填", "zh-Hans": "必填", en: "Required" },
	tryAgain: { "zh-Hant": "重新載入", "zh-Hans": "重新加载", en: "Try again" }
};

export type WebhookT = Record<keyof typeof webhookTranslations, string>;

export const webhookEventTypes = [
	{ value: "registration_confirmed", labelKey: "registrationConfirmed", descKey: "registrationConfirmedDesc" },
	{ value: "registration_cancelled", labelKey: "registrationCancelled", descKey: "registrationCancelledDesc" }
] as const satisfies readonly { value: string; labelKey: keyof typeof webhookTranslations; descKey: keyof typeof webhookTranslations }[];

export function eventTypeLabel(t: WebhookT, value: string): string {
	const found = webhookEventTypes.find(type => type.value === value);
	return found ? t[found.labelKey] : value;
}

export function errorDetail(error: unknown): string {
	return error instanceof Error && error.message ? `: ${error.message}` : "";
}
