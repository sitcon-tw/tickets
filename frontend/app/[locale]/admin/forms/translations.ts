import { getTranslations } from "@/i18n/helpers";
import { useMemo } from "react";

export function useFormsTranslations(locale: string) {
	return useMemo(
		() =>
			getTranslations(locale, {
				// Page
				title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
				formInfo: {
					"zh-Hant": "此表單適用於本活動的所有票種，報名時會依序顯示欄位",
					"zh-Hans": "此表单适用于本活动的所有票种，报名时会依序显示栏位",
					en: "This form applies to every ticket of this event and is shown during registration"
				},
				noEventTitle: { "zh-Hant": "尚未選擇活動", "zh-Hans": "尚未选择活动", en: "No event selected" },
				noEventDescription: {
					"zh-Hant": "請先從側邊欄選擇活動，或前往活動列表建立活動。",
					"zh-Hans": "请先从侧边栏选择活动，或前往活动列表建立活动。",
					en: "Pick an event from the sidebar, or go to the event list to create one."
				},
				goToEvents: { "zh-Hant": "前往活動列表", "zh-Hans": "前往活动列表", en: "Go to events" },
				save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save form" },
				unsavedChanges: { "zh-Hant": "有尚未儲存的變更", "zh-Hans": "有尚未保存的变更", en: "You have unsaved changes" },
				discard: { "zh-Hant": "捨棄變更", "zh-Hans": "舍弃变更", en: "Discard changes" },
				discardTitle: { "zh-Hant": "捨棄所有未儲存的變更？", "zh-Hans": "舍弃所有未保存的变更？", en: "Discard all unsaved changes?" },
				discardDescription: { "zh-Hant": "表單將還原為上次儲存的內容。", "zh-Hans": "表单将还原为上次保存的内容。", en: "The form will be restored to its last saved state." },
				leaveTitle: { "zh-Hant": "離開此頁面？", "zh-Hans": "离开此页面？", en: "Leave this page?" },
				leaveDescription: {
					"zh-Hant": "表單有尚未儲存的變更，離開後這些變更將會遺失。",
					"zh-Hans": "表单有尚未保存的变更，离开后这些变更将会遗失。",
					en: "The form has unsaved changes that will be lost if you leave."
				},
				leaveConfirm: { "zh-Hant": "離開並捨棄", "zh-Hans": "离开并舍弃", en: "Leave and discard" },
				addField: { "zh-Hant": "新增欄位", "zh-Hans": "新增栏位", en: "Add field" },
				fieldsHeading: { "zh-Hant": "表單欄位", "zh-Hans": "表单栏位", en: "Form fields" },
				fieldCount: { "zh-Hant": "{count} 個欄位", "zh-Hans": "{count} 个栏位", en: "{count} fields" },
				tabBuilder: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Builder" },
				tabPreview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
				noFields: { "zh-Hant": "目前尚無表單欄位", "zh-Hans": "目前尚无表单栏位", en: "No form fields yet" },
				noFieldsHelp: {
					"zh-Hant": "新增第一個欄位開始建立報名表單，或從其他活動複製。",
					"zh-Hans": "新增第一个栏位开始建立报名表单，或从其他活动复制。",
					en: "Add your first field to start building the registration form, or copy one from another event."
				},
				selectFieldTitle: { "zh-Hant": "選擇一個欄位進行編輯", "zh-Hans": "选择一个栏位进行编辑", en: "Select a field to edit" },
				selectFieldHelp: {
					"zh-Hant": "從左側清單點選欄位，即可編輯名稱、選項與顯示條件。",
					"zh-Hans": "从左侧清单点选栏位，即可编辑名称、选项与显示条件。",
					en: "Pick a field from the list to edit its name, options and display conditions."
				},
				editField: { "zh-Hant": "編輯欄位", "zh-Hans": "编辑栏位", en: "Edit field" },
				deleteConfirmTitle: { "zh-Hant": "刪除此欄位？", "zh-Hans": "删除此栏位？", en: "Delete this field?" },
				deleteConfirmDescription: {
					"zh-Hant": "欄位「{name}」將在儲存表單後從活動中移除，已填寫的報名資料不受影響。",
					"zh-Hans": "栏位「{name}」将在保存表单后从活动中移除，已填写的报名数据不受影响。",
					en: 'The field "{name}" will be removed from the event once you save the form. Existing registration answers are not affected.'
				},
				deleteReferenced: {
					"zh-Hant": "有 {count} 個欄位的顯示條件引用了此欄位，需要重新設定。",
					"zh-Hans": "有 {count} 个栏位的显示条件引用了此栏位，需要重新设定。",
					en: "{count} other field(s) use this field in their display conditions and will need fixing."
				},
				saveSuccess: { "zh-Hant": "表單已儲存", "zh-Hans": "表单已保存", en: "Form saved" },
				saveFailed: { "zh-Hant": "儲存失敗：", "zh-Hans": "保存失败：", en: "Save failed: " },
				savePartial: { "zh-Hant": "部分變更儲存失敗，請修正後再試一次：", "zh-Hans": "部分变更保存失败，请修正后再试一次：", en: "Some changes could not be saved, please try again: " },
				validationFailed: { "zh-Hant": "表單有 {count} 個問題需要修正才能儲存", "zh-Hans": "表单有 {count} 个问题需要修正才能保存", en: "Fix {count} issue(s) before saving" },
				copySuccess: { "zh-Hant": "已複製表單，請檢查後儲存", "zh-Hans": "已复制表单，请检查后保存", en: "Form copied. Review it and save." },
				copyFailed: { "zh-Hant": "複製失敗：", "zh-Hans": "复制失败：", en: "Copy failed: " },
				loadFailed: { "zh-Hant": "無法載入表單欄位", "zh-Hans": "无法载入表单栏位", en: "Could not load the form fields" },
				retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
				untitled: { "zh-Hant": "未命名欄位", "zh-Hans": "未命名栏位", en: "Untitled field" },
				cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
				close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },

				// Copy dialog
				copyFrom: { "zh-Hant": "複製其他活動的表單", "zh-Hans": "复制其他活动的表单", en: "Copy form from another event" },
				copyDescription: {
					"zh-Hant": "將其他活動的表單欄位複製到這個活動，複製後可以自由調整。",
					"zh-Hans": "将其他活动的表单栏位复制到这个活动，复制后可以自由调整。",
					en: "Copy the form fields of another event into this one. You can edit them freely afterwards."
				},
				copySourceEvent: { "zh-Hant": "來源活動", "zh-Hans": "来源活动", en: "Source event" },
				selectEvent: { "zh-Hant": "選擇活動...", "zh-Hans": "选择活动...", en: "Select event..." },
				noOtherEvents: { "zh-Hant": "沒有其他可複製的活動。", "zh-Hans": "没有其他可复制的活动。", en: "There are no other events to copy from." },
				copyReplaceWarning: {
					"zh-Hant": "目前表單中的所有欄位會被取代，並在你儲存後才會生效。",
					"zh-Hans": "目前表单中的所有栏位会被取代，并在你保存后才会生效。",
					en: "All fields currently in this form will be replaced. Nothing changes until you save."
				},
				copyConditionsNote: {
					"zh-Hant": "票種類型的顯示條件屬於來源活動，複製後需要重新選擇票種。",
					"zh-Hans": "票种类型的显示条件属于来源活动，复制后需要重新选择票种。",
					en: "Ticket-based display conditions belong to the source event, so you will need to pick the tickets again."
				},
				copyAction: { "zh-Hant": "複製表單", "zh-Hans": "复制表单", en: "Copy form" },

				// Field list
				conditional: { "zh-Hant": "有顯示條件", "zh-Hans": "有显示条件", en: "Conditional" },
				issueCount: { "zh-Hant": "{count} 個問題", "zh-Hans": "{count} 个问题", en: "{count} issue(s)" },
				moreActions: { "zh-Hant": "更多操作", "zh-Hans": "更多操作", en: "More actions" },
				duplicateField: { "zh-Hant": "複製欄位", "zh-Hans": "复制栏位", en: "Duplicate field" },
				deleteField: { "zh-Hant": "刪除欄位", "zh-Hans": "删除栏位", en: "Delete field" },
				moveUp: { "zh-Hant": "上移", "zh-Hans": "上移", en: "Move up" },
				moveDown: { "zh-Hant": "下移", "zh-Hans": "下移", en: "Move down" },
				dragToReorder: { "zh-Hant": "拖曳以重新排序", "zh-Hans": "拖曳以重新排序", en: "Drag to reorder" },

				// Field editor
				tabContent: { "zh-Hant": "內容", "zh-Hans": "内容", en: "Content" },
				tabAnswer: { "zh-Hant": "作答設定", "zh-Hans": "作答设定", en: "Answer" },
				tabConditions: { "zh-Hant": "顯示條件", "zh-Hans": "显示条件", en: "Conditions" },
				hasIssues: { "zh-Hant": "有問題", "zh-Hans": "有问题", en: "Has issues" },
				fieldName: { "zh-Hant": "欄位名稱", "zh-Hans": "栏位名称", en: "Field name" },
				nameEnPlaceholder: { "zh-Hant": "英文名稱（必填）", "zh-Hans": "英文名称（必填）", en: "English name (required)" },
				fieldNameHelp: {
					"zh-Hant": "英文名稱必填且不可重複，同時作為報名資料的識別名稱。",
					"zh-Hans": "英文名称必填且不可重复，同时作为报名数据的识别名称。",
					en: "The English name is required and must be unique. It also identifies the answer in registration data."
				},
				fieldType: { "zh-Hant": "欄位類型", "zh-Hans": "栏位类型", en: "Field type" },
				typeText: { "zh-Hant": "文字輸入", "zh-Hans": "文字输入", en: "Text input" },
				typeTextarea: { "zh-Hant": "多行文字", "zh-Hans": "多行文字", en: "Textarea" },
				typeSelect: { "zh-Hant": "下拉選單", "zh-Hans": "下拉选单", en: "Dropdown" },
				typeRadio: { "zh-Hant": "單選按鈕", "zh-Hans": "单选按钮", en: "Radio buttons" },
				typeCheckbox: { "zh-Hant": "勾選框", "zh-Hans": "勾选框", en: "Checkbox" },
				fieldRequired: { "zh-Hant": "必填", "zh-Hans": "必填", en: "Required" },
				requiredHelp: { "zh-Hant": "報名者必須填寫此欄位", "zh-Hans": "报名者必须填写此栏位", en: "Attendees must answer this field" },
				fieldDescription: { "zh-Hant": "說明文字", "zh-Hans": "说明文字", en: "Description" },
				descriptionHelp: { "zh-Hant": "顯示在欄位下方，支援 Markdown。", "zh-Hans": "显示在栏位下方，支持 Markdown。", en: "Shown with the field. Markdown is supported." },
				markdownPreview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
				optionSettings: { "zh-Hant": "選項", "zh-Hans": "选项", en: "Options" },
				optionsHelp: {
					"zh-Hant": "英文名稱必填且不可重複，同時作為儲存的答案值。",
					"zh-Hans": "英文名称必填且不可重复，同时作为保存的答案值。",
					en: "The English label is required and unique; it is also the stored answer value."
				},
				checkboxOptionsHelp: {
					"zh-Hant": "沒有選項時為單一勾選框（同意條款等）；有選項時可複選。",
					"zh-Hans": "没有选项时为单一勾选框（同意条款等）；有选项时可复选。",
					en: "With no options this is a single checkbox (e.g. accept terms); with options attendees can tick several."
				},
				option: { "zh-Hant": "選項", "zh-Hans": "选项", en: "Option" },
				optionRequiredPlaceholder: { "zh-Hant": "英文選項（必填）", "zh-Hans": "英文选项（必填）", en: "English option (required)" },
				optionDuplicate: { "zh-Hant": "選項名稱重複", "zh-Hans": "选项名称重复", en: "Duplicate option name" },
				noOptions: { "zh-Hant": "尚無選項", "zh-Hans": "尚无选项", en: "No options yet" },
				addOption: { "zh-Hant": "新增選項", "zh-Hans": "新增选项", en: "Add option" },
				deleteOption: { "zh-Hant": "刪除選項", "zh-Hans": "删除选项", en: "Delete option" },
				enableOther: { "zh-Hant": "允許「其他」選項", "zh-Hans": "允许「其他」选项", en: "Allow an “Other” option" },
				enableOtherDescription: { "zh-Hant": "使用者可選擇「其他」並輸入自訂內容", "zh-Hans": "使用者可选择「其他」并输入自订内容", en: "Attendees can choose “Other” and type their own answer" },
				validator: { "zh-Hant": "驗證正規表達式", "zh-Hans": "验证正则表达式", en: "Validation regex" },
				validatorPlaceholder: { "zh-Hant": "例如：^[A-Z0-9]+$（選填）", "zh-Hans": "例如：^[A-Z0-9]+$（选填）", en: "e.g. ^[A-Z0-9]+$ (optional)" },
				useValidator: {
					"zh-Hant": "使用此正規表達式驗證輸入內容，留空則不驗證。",
					"zh-Hans": "使用此正则表达式验证输入内容，留空则不验证。",
					en: "Answers are validated against this regex. Leave empty for no validation."
				},
				promptSettings: { "zh-Hant": "自動完成提示", "zh-Hans": "自动完成提示", en: "Autocomplete suggestions" },
				promptDescription: {
					"zh-Hant": "每行一個建議，使用者輸入時會顯示（依使用者語言）。",
					"zh-Hans": "每行一个建议，使用者输入时会显示（依使用者语言）。",
					en: "One suggestion per line, shown as the attendee types (in their language)."
				},
				promptPlaceholder: { "zh-Hant": "每行一個建議", "zh-Hans": "每行一个建议", en: "One suggestion per line" },
				noAnswerSettings: {
					"zh-Hant": "多行文字沒有其他作答設定，可選擇填寫驗證規則。",
					"zh-Hans": "多行文字没有其他作答设定，可选择填写验证规则。",
					en: "Textareas have no other answer settings apart from the optional regex."
				},

				// Display conditions
				displayFilters: { "zh-Hant": "顯示條件", "zh-Hans": "显示条件", en: "Display conditions" },
				displayFiltersHelp: {
					"zh-Hant": "依票種、其他欄位的答案或時間，決定是否顯示此欄位。",
					"zh-Hans": "依票种、其他栏位的答案或时间，决定是否显示此栏位。",
					en: "Show or hide this field depending on the ticket, another answer, or the time."
				},
				enableFilters: { "zh-Hant": "啟用條件顯示", "zh-Hans": "启用条件显示", en: "Enable conditional display" },
				enableFiltersHelp: { "zh-Hant": "未啟用時，此欄位一律顯示。", "zh-Hans": "未启用时，此栏位一律显示。", en: "When off, the field is always shown." },
				filterAction: { "zh-Hant": "符合條件時", "zh-Hans": "符合条件时", en: "When conditions match" },
				actionDisplay: { "zh-Hant": "顯示此欄位", "zh-Hans": "显示此栏位", en: "Show this field" },
				actionHide: { "zh-Hant": "隱藏此欄位", "zh-Hans": "隐藏此栏位", en: "Hide this field" },
				filterOperator: { "zh-Hant": "條件連接方式", "zh-Hans": "条件连接方式", en: "Combine conditions" },
				operatorAnd: { "zh-Hant": "全部符合 (AND)", "zh-Hans": "全部符合 (AND)", en: "All match (AND)" },
				operatorOr: { "zh-Hant": "任一符合 (OR)", "zh-Hans": "任一符合 (OR)", en: "Any match (OR)" },
				noConditions: { "zh-Hant": "尚未新增條件，請至少新增一個條件。", "zh-Hans": "尚未新增条件，请至少新增一个条件。", en: "No conditions yet. Add at least one." },
				addCondition: { "zh-Hant": "新增條件", "zh-Hans": "新增条件", en: "Add condition" },
				condition: { "zh-Hant": "條件", "zh-Hans": "条件", en: "Condition" },
				conditionType: { "zh-Hant": "類型", "zh-Hans": "类型", en: "Type" },
				typeTicket: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
				typeField: { "zh-Hant": "其他欄位的答案", "zh-Hans": "其他栏位的答案", en: "Another field's answer" },
				typeTime: { "zh-Hant": "時間範圍", "zh-Hans": "时间范围", en: "Time range" },
				selectTicket: { "zh-Hant": "選擇票種", "zh-Hans": "选择票种", en: "Select ticket" },
				selectField: { "zh-Hant": "選擇欄位", "zh-Hans": "选择栏位", en: "Select field" },
				fieldOperator: { "zh-Hant": "比對方式", "zh-Hans": "比对方式", en: "Match" },
				operatorEquals: { "zh-Hant": "等於", "zh-Hans": "等于", en: "Equals" },
				operatorFilled: { "zh-Hant": "已填寫", "zh-Hans": "已填写", en: "Is filled" },
				operatorNotFilled: { "zh-Hant": "未填寫", "zh-Hans": "未填写", en: "Is empty" },
				fieldValue: { "zh-Hant": "答案值", "zh-Hans": "答案值", en: "Answer value" },
				selectValue: { "zh-Hant": "選擇答案", "zh-Hans": "选择答案", en: "Select answer" },
				startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start time" },
				endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End time" },
				timeHelp: {
					"zh-Hant": "時間為 UTC+8（台灣時間），可只填開始或結束其中一項。",
					"zh-Hans": "时间为 UTC+8（台湾时间），可只填开始或结束其中一项。",
					en: "Times are UTC+8 (Taiwan time). You can fill only the start or only the end."
				},
				deleteCondition: { "zh-Hant": "刪除條件", "zh-Hans": "删除条件", en: "Delete condition" },

				// Preview
				previewHelp: {
					"zh-Hant": "使用與報名頁相同的元件呈現目前的表單（含尚未儲存的變更），輸入內容不會被儲存。",
					"zh-Hans": "使用与报名页相同的组件呈现目前的表单（含尚未保存的变更），输入内容不会被保存。",
					en: "Shows the current form (including unsaved changes) with the same components as the registration page. Nothing you type is saved."
				},
				previewTicket: { "zh-Hant": "模擬票種", "zh-Hans": "模拟票种", en: "Simulate ticket" },
				previewEmpty: { "zh-Hant": "沒有可預覽的欄位", "zh-Hans": "没有可预览的栏位", en: "Nothing to preview" },
				previewEmptyHelp: { "zh-Hant": "新增欄位後即可在這裡預覽報名表單。", "zh-Hans": "新增栏位后即可在这里预览报名表单。", en: "Add fields to preview the registration form here." },
				previewAllHidden: { "zh-Hant": "依目前的條件，所有欄位都被隱藏。", "zh-Hans": "依目前的条件，所有栏位都被隐藏。", en: "With the current conditions every field is hidden." },
				previewHidden: { "zh-Hant": "另有 {count} 個欄位因顯示條件而隱藏", "zh-Hans": "另有 {count} 个栏位因显示条件而隐藏", en: "{count} more field(s) hidden by display conditions" },
				pleaseSelect: { "zh-Hant": "請選擇", "zh-Hans": "请选择", en: "Please select" },

				// Validation messages
				issueNameRequired: { "zh-Hant": "請填寫英文欄位名稱", "zh-Hans": "请填写英文栏位名称", en: "Enter an English field name" },
				issueNameDuplicate: { "zh-Hant": "欄位名稱與其他欄位重複，請改用不同名稱", "zh-Hans": "栏位名称与其他栏位重复，请改用不同名称", en: "Another field has the same name. Use a unique name" },
				issueOptionsRequired: { "zh-Hant": "此類型至少需要一個選項", "zh-Hans": "此类型至少需要一个选项", en: "This field type needs at least one option" },
				issueOptionNameRequired: { "zh-Hant": "每個選項都需要填寫英文名稱", "zh-Hans": "每个选项都需要填写英文名称", en: "Every option needs an English label" },
				issueOptionDuplicate: { "zh-Hant": "有選項的英文名稱重複", "zh-Hans": "有选项的英文名称重复", en: "Some options share the same English label" },
				issueRegexInvalid: { "zh-Hant": "驗證正規表達式無效", "zh-Hans": "验证正则表达式无效", en: "The validation regex is not valid" },
				issueFilterNoConditions: { "zh-Hant": "已啟用條件顯示但沒有任何條件", "zh-Hans": "已启用条件显示但没有任何条件", en: "Conditional display is on but there are no conditions" },
				issueConditionNoTicket: { "zh-Hant": "有票種條件尚未選擇票種", "zh-Hans": "有票种条件尚未选择票种", en: "A ticket condition has no ticket selected" },
				issueConditionNoField: { "zh-Hant": "有欄位條件尚未選擇欄位", "zh-Hans": "有栏位条件尚未选择栏位", en: "A field condition has no field selected" },
				issueConditionMissingField: {
					"zh-Hant": "有條件引用了不存在的欄位（可能已被刪除）",
					"zh-Hans": "有条件引用了不存在的栏位（可能已被删除）",
					en: "A condition points to a field that no longer exists"
				},
				issueConditionNoValue: { "zh-Hant": "有「等於」條件尚未填寫答案值", "zh-Hans": "有「等于」条件尚未填写答案值", en: "An “Equals” condition has no answer value" },
				issueConditionNoTime: { "zh-Hant": "有時間條件尚未設定開始或結束時間", "zh-Hans": "有时间条件尚未设定开始或结束时间", en: "A time condition has neither a start nor an end time" },
				issueConditionTimeOrder: { "zh-Hant": "有時間條件的開始時間晚於結束時間", "zh-Hans": "有时间条件的开始时间晚于结束时间", en: "A time condition starts after it ends" },
				issueConditionCircular: { "zh-Hant": "顯示條件形成循環引用（欄位互相依賴）", "zh-Hans": "显示条件形成循环引用（栏位互相依赖）", en: "Display conditions depend on each other in a loop" }
			}),
		[locale]
	);
}

export const NEW_FIELD_NAMES = { en: "New question", zhHant: "新問題", zhHans: "新问题" };
export const COPY_SUFFIX = { en: "(copy)", zhHant: "（副本）", zhHans: "（副本）" };
