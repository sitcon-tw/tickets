export const checkInsTranslations = {
	title: { "zh-Hant": "報到", en: "Check-ins" },
	description: {
		"zh-Hant": "掃描參加者的 QR Code，或搜尋參加者並手動報到。",
		en: "Scan attendees' QR codes, or search for an attendee and check them in manually."
	},
	noEventTitle: { "zh-Hant": "請先選擇活動", en: "Select an event first" },
	noEventDescription: { "zh-Hant": "選擇活動後即可開始報到。", en: "Choose an event to start checking people in." },
	loadFailed: { "zh-Hant": "無法載入報到名單", en: "Failed to load the attendee list" },
	retry: { "zh-Hant": "重試", en: "Retry" },
	refresh: { "zh-Hant": "重新整理", en: "Refresh" },
	unknownError: { "zh-Hant": "未知的錯誤", en: "Unknown error" },

	statsLabel: { "zh-Hant": "報到統計", en: "Check-in statistics" },
	statTotal: { "zh-Hant": "已確認報名", en: "Confirmed" },
	statCheckedIn: { "zh-Hant": "已報到", en: "Checked in" },
	statRemaining: { "zh-Hant": "尚未報到", en: "Not checked in" },

	tabScan: { "zh-Hant": "掃描 QR Code", en: "Scan QR code" },
	tabManual: { "zh-Hant": "手動報到", en: "Manual check-in" },

	startScanning: { "zh-Hant": "開啟相機掃描", en: "Start scanning" },
	stopScanning: { "zh-Hant": "關閉相機", en: "Stop camera" },
	scanIdleTitle: { "zh-Hant": "尚未掃描", en: "Nothing scanned yet" },
	scanIdleDescription: {
		"zh-Hant": "掃描成功後會自動完成報到，結果會顯示在這裡。",
		en: "Scanning a valid ticket checks the attendee in automatically. The result shows up here."
	},
	scanProcessing: { "zh-Hant": "處理中...", en: "Processing..." },
	scanSuccess: { "zh-Hant": "報到成功", en: "Checked in" },
	scanAlready: { "zh-Hant": "已經報到過了", en: "Already checked in" },
	scanAlreadyAt: { "zh-Hant": "報到時間：{time}", en: "Checked in at {time}" },
	scanCancelled: { "zh-Hant": "此報名已取消，無法報到", en: "This registration is cancelled and cannot be checked in" },
	scanNotFound: { "zh-Hant": "找不到對應的報名資料", en: "No matching registration for this event" },
	scanNotFoundDescription: {
		"zh-Hant": "此 QR Code 不屬於目前選擇的活動，或已不存在。",
		en: "This QR code does not belong to the selected event, or no longer exists."
	},
	scanFailed: { "zh-Hant": "報到失敗", en: "Check-in failed" },
	undo: { "zh-Hant": "取消報到", en: "Undo" },

	search: { "zh-Hant": "搜尋姓名、Email、電話、QR 內容、表單資料...", en: "Search name, email, phone, QR content, form data..." },
	clearSearch: { "zh-Hant": "清除搜尋", en: "Clear search" },
	filterLabel: { "zh-Hant": "依報到狀態篩選", en: "Filter by check-in status" },
	filterAll: { "zh-Hant": "全部", en: "All" },
	filterNotCheckedIn: { "zh-Hant": "尚未報到", en: "Not checked in" },
	filterCheckedIn: { "zh-Hant": "已報到", en: "Checked in" },
	noAttendees: { "zh-Hant": "此活動尚無報名資料", en: "No registrations for this event yet" },
	noMatches: { "zh-Hant": "沒有符合條件的參加者", en: "No attendees match your search" },
	clearFilters: { "zh-Hant": "清除篩選", en: "Clear filters" },

	colAttendee: { "zh-Hant": "參加者", en: "Attendee" },
	colPhone: { "zh-Hant": "電話", en: "Phone" },
	colTicket: { "zh-Hant": "票種", en: "Ticket" },
	colStatus: { "zh-Hant": "報到狀態", en: "Check-in" },
	colAction: { "zh-Hant": "操作", en: "Action" },
	checkedIn: { "zh-Hant": "已報到", en: "Checked in" },
	notCheckedIn: { "zh-Hant": "未報到", en: "Not checked in" },
	cancelled: { "zh-Hant": "已取消", en: "Cancelled" },
	checkIn: { "zh-Hant": "報到", en: "Check in" },

	checkInSuccess: { "zh-Hant": "{name} 已報到", en: "{name} checked in" },
	checkInAlready: { "zh-Hant": "{name} 先前已報到", en: "{name} was already checked in" },
	undoSuccess: { "zh-Hant": "已取消 {name} 的報到", en: "Check-in undone for {name}" },
	updateFailed: { "zh-Hant": "操作失敗", en: "Action failed" }
};

export type CheckInsT = Record<keyof typeof checkInsTranslations, string>;
