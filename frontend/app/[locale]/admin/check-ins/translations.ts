export const checkInsTranslations = {
	title: { "zh-Hant": "報到", "zh-Hans": "报到", en: "Check-ins" },
	description: {
		"zh-Hant": "掃描參加者的 QR Code，或搜尋參加者並手動報到。",
		"zh-Hans": "扫描参加者的 QR Code，或搜索参加者并手动报到。",
		en: "Scan attendees' QR codes, or search for an attendee and check them in manually."
	},
	noEventTitle: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Select an event first" },
	noEventDescription: { "zh-Hant": "選擇活動後即可開始報到。", "zh-Hans": "选择活动后即可开始报到。", en: "Choose an event to start checking people in." },
	loadFailed: { "zh-Hant": "無法載入報到名單", "zh-Hans": "无法载入报到名单", en: "Failed to load the attendee list" },
	retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
	refresh: { "zh-Hant": "重新整理", "zh-Hans": "重新整理", en: "Refresh" },
	unknownError: { "zh-Hant": "未知的錯誤", "zh-Hans": "未知的错误", en: "Unknown error" },

	statsLabel: { "zh-Hant": "報到統計", "zh-Hans": "报到统计", en: "Check-in statistics" },
	statTotal: { "zh-Hant": "已確認報名", "zh-Hans": "已确认报名", en: "Confirmed" },
	statCheckedIn: { "zh-Hant": "已報到", "zh-Hans": "已报到", en: "Checked in" },
	statRemaining: { "zh-Hant": "尚未報到", "zh-Hans": "尚未报到", en: "Not checked in" },

	tabScan: { "zh-Hant": "掃描 QR Code", "zh-Hans": "扫描 QR Code", en: "Scan QR code" },
	tabManual: { "zh-Hant": "手動報到", "zh-Hans": "手动报到", en: "Manual check-in" },

	startScanning: { "zh-Hant": "開啟相機掃描", "zh-Hans": "开启相机扫描", en: "Start scanning" },
	stopScanning: { "zh-Hant": "關閉相機", "zh-Hans": "关闭相机", en: "Stop camera" },
	scanIdleTitle: { "zh-Hant": "尚未掃描", "zh-Hans": "尚未扫描", en: "Nothing scanned yet" },
	scanIdleDescription: {
		"zh-Hant": "掃描成功後會自動完成報到，結果會顯示在這裡。",
		"zh-Hans": "扫描成功后会自动完成报到，结果会显示在这里。",
		en: "Scanning a valid ticket checks the attendee in automatically. The result shows up here."
	},
	scanProcessing: { "zh-Hant": "處理中...", "zh-Hans": "处理中...", en: "Processing..." },
	scanSuccess: { "zh-Hant": "報到成功", "zh-Hans": "报到成功", en: "Checked in" },
	scanAlready: { "zh-Hant": "已經報到過了", "zh-Hans": "已经报到过了", en: "Already checked in" },
	scanAlreadyAt: { "zh-Hant": "報到時間：{time}", "zh-Hans": "报到时间：{time}", en: "Checked in at {time}" },
	scanCancelled: { "zh-Hant": "此報名已取消，無法報到", "zh-Hans": "此报名已取消，无法报到", en: "This registration is cancelled and cannot be checked in" },
	scanNotFound: { "zh-Hant": "找不到對應的報名資料", "zh-Hans": "找不到对应的报名资料", en: "No matching registration for this event" },
	scanNotFoundDescription: {
		"zh-Hant": "此 QR Code 不屬於目前選擇的活動，或已不存在。",
		"zh-Hans": "此 QR Code 不属于当前选择的活动，或已不存在。",
		en: "This QR code does not belong to the selected event, or no longer exists."
	},
	scanFailed: { "zh-Hant": "報到失敗", "zh-Hans": "报到失败", en: "Check-in failed" },
	undo: { "zh-Hant": "取消報到", "zh-Hans": "取消报到", en: "Undo" },

	search: { "zh-Hant": "搜尋姓名、Email、電話、QR 內容、表單資料...", "zh-Hans": "搜索姓名、Email、电话、QR 内容、表单资料...", en: "Search name, email, phone, QR content, form data..." },
	clearSearch: { "zh-Hant": "清除搜尋", "zh-Hans": "清除搜索", en: "Clear search" },
	filterLabel: { "zh-Hant": "依報到狀態篩選", "zh-Hans": "按报到状态筛选", en: "Filter by check-in status" },
	filterAll: { "zh-Hant": "全部", "zh-Hans": "全部", en: "All" },
	filterNotCheckedIn: { "zh-Hant": "尚未報到", "zh-Hans": "尚未报到", en: "Not checked in" },
	filterCheckedIn: { "zh-Hant": "已報到", "zh-Hans": "已报到", en: "Checked in" },
	noAttendees: { "zh-Hant": "此活動尚無報名資料", "zh-Hans": "此活动尚无报名资料", en: "No registrations for this event yet" },
	noMatches: { "zh-Hant": "沒有符合條件的參加者", "zh-Hans": "没有符合条件的参加者", en: "No attendees match your search" },
	clearFilters: { "zh-Hant": "清除篩選", "zh-Hans": "清除筛选", en: "Clear filters" },

	colAttendee: { "zh-Hant": "參加者", "zh-Hans": "参加者", en: "Attendee" },
	colPhone: { "zh-Hant": "電話", "zh-Hans": "电话", en: "Phone" },
	colTicket: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
	colStatus: { "zh-Hant": "報到狀態", "zh-Hans": "报到状态", en: "Check-in" },
	colAction: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Action" },
	checkedIn: { "zh-Hant": "已報到", "zh-Hans": "已报到", en: "Checked in" },
	notCheckedIn: { "zh-Hant": "未報到", "zh-Hans": "未报到", en: "Not checked in" },
	cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
	checkIn: { "zh-Hant": "報到", "zh-Hans": "报到", en: "Check in" },

	checkInSuccess: { "zh-Hant": "{name} 已報到", "zh-Hans": "{name} 已报到", en: "{name} checked in" },
	checkInAlready: { "zh-Hant": "{name} 先前已報到", "zh-Hans": "{name} 先前已报到", en: "{name} was already checked in" },
	undoSuccess: { "zh-Hant": "已取消 {name} 的報到", "zh-Hans": "已取消 {name} 的报到", en: "Check-in undone for {name}" },
	updateFailed: { "zh-Hant": "操作失敗", "zh-Hans": "操作失败", en: "Action failed" }
};

export type CheckInsT = Record<keyof typeof checkInsTranslations, string>;
