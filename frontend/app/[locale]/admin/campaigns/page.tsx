"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import PageSpinner from "@/components/PageSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEmailCampaignsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import { getLocalizedText } from "@/lib/utils/localization";
import type { EmailCampaign, Event, Ticket } from "@sitcontix/types";
import { FileText, Loader2, Mail, RotateCw, Users } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createCampaignsColumns, type CampaignDisplay } from "./columns";

type TargetAudienceForm = {
	eventIds: string[];
	ticketIds: string[];
	registrationStatuses: string[];
	hasReferrals: boolean | undefined;
	isReferrer: boolean | undefined;
	emailDomains: string[];
};

type FormData = {
	name: string;
	subject: string;
	content: string;
	targetAudience: TargetAudienceForm;
};

type Template = { id: string; name: string; description: string; content: string };
type Recipient = { email: string; id: string };
type PreviewTab = "html" | "recipients";
type SendingCampaign = { id: string; name: string; total: number; sent: number };

const TEMPLATE_VARIABLES: Array<{ key: string; label: string; description: string; category: string }> = [
	// Identity
	{ key: "{{email}}", label: "{{email}}", description: "收件人 email", category: "identity" },
	{ key: "{{name}}", label: "{{name}}", description: "姓名", category: "identity" },
	// Event
	{ key: "{{eventName}}", label: "{{eventName}}", description: "活動名稱", category: "event" },
	{ key: "{{eventDate}}", label: "{{eventDate}}", description: "活動開始日期", category: "event" },
	{ key: "{{eventEndDate}}", label: "{{eventEndDate}}", description: "活動結束日期", category: "event" },
	{ key: "{{eventLocation}}", label: "{{eventLocation}}", description: "活動地點", category: "event" },
	// Ticket
	{ key: "{{ticketName}}", label: "{{ticketName}}", description: "票種名稱", category: "ticket" },
	{ key: "{{ticketPrice}}", label: "{{ticketPrice}}", description: "票價", category: "ticket" },
	// Registration
	{ key: "{{registrationId}}", label: "{{registrationId}}", description: "報名 ID", category: "registration" }
];

const VARIABLE_CATEGORY_COLORS: Record<string, string> = {
	identity: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800",
	event: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800",
	ticket: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-800",
	registration: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
};

const buildTargetAudience = (ta: TargetAudienceForm) => ({
	...(ta.eventIds.length > 0 && { eventIds: ta.eventIds }),
	...(ta.ticketIds.length > 0 && { ticketIds: ta.ticketIds }),
	...(ta.registrationStatuses.length > 0 && { registrationStatuses: ta.registrationStatuses }),
	...(ta.hasReferrals !== undefined && { hasReferrals: ta.hasReferrals }),
	...(ta.isReferrer !== undefined && { isReferrer: ta.isReferrer }),
	...(ta.emailDomains.length > 0 && { emailDomains: ta.emailDomains })
});

function getStatusBadgeClass(status: string) {
	switch (status) {
		case "sent":
			return "active";
		case "draft":
			return "pending";
		case "sending":
			return "active";
		case "cancelled":
			return "ended";
		default:
			return "";
	}
}

const INITIAL_FORM: FormData = {
	name: "",
	subject: "",
	content: "",
	targetAudience: {
		eventIds: [],
		ticketIds: [],
		registrationStatuses: [],
		hasReferrals: undefined,
		isReferrer: undefined,
		emailDomains: []
	}
};

type CampaignsState = {
	campaigns: EmailCampaign[];
	isLoading: boolean;
	showCreateModal: boolean;
	formData: FormData;
	isSaving: boolean;
	recipientCount: number | null;
	recipientList: Recipient[];
	isCalculating: boolean;
	showRecipientsModal: boolean;
	templates: Template[];
	showTemplateModal: boolean;
	showPreviewModal: boolean;
	selectedCampaign: EmailCampaign | null;
	previewHtml: string;
	previewRecipients: Recipient[];
	previewTab: PreviewTab;
	sendingCampaign: SendingCampaign | null;
	events: Event[];
	tickets: Ticket[];
};

type CampaignsAction =
	| { type: "setCampaignsLoading"; value: boolean }
	| { type: "campaignsLoaded"; campaigns: EmailCampaign[] }
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "ticketsLoaded"; tickets: Ticket[] }
	| { type: "templatesLoaded"; templates: Template[] }
	| { type: "setCreateModal"; value: boolean }
	| { type: "setFormField"; field: keyof Pick<FormData, "name" | "subject" | "content">; value: string }
	| { type: "setFormContent"; content: string }
	| { type: "toggleTargetAudience"; field: keyof Pick<TargetAudienceForm, "eventIds" | "ticketIds" | "registrationStatuses">; id: string; checked: boolean }
	| { type: "recipientPreviewStarted" }
	| { type: "recipientPreviewLoaded"; count: number; recipients: Recipient[] }
	| { type: "setRecipientsModal"; value: boolean }
	| { type: "setSaving"; value: boolean }
	| { type: "campaignCreated" }
	| { type: "previewLoaded"; campaign: EmailCampaign; html: string; recipients: Recipient[] }
	| { type: "setPreviewModal"; value: boolean }
	| { type: "setPreviewTab"; value: PreviewTab }
	| { type: "startSending"; campaign: SendingCampaign }
	| { type: "updateSending"; sent: number; total: number }
	| { type: "stopSending" }
	| { type: "setTemplateModal"; value: boolean }
	| { type: "templateImported"; content: string };

const initialCampaignsState: CampaignsState = {
	campaigns: [],
	isLoading: false,
	showCreateModal: false,
	formData: INITIAL_FORM,
	isSaving: false,
	recipientCount: null,
	recipientList: [],
	isCalculating: false,
	showRecipientsModal: false,
	templates: [],
	showTemplateModal: false,
	showPreviewModal: false,
	selectedCampaign: null,
	previewHtml: "",
	previewRecipients: [],
	previewTab: "html",
	sendingCampaign: null,
	events: [],
	tickets: []
};

function campaignsReducer(state: CampaignsState, action: CampaignsAction): CampaignsState {
	switch (action.type) {
		case "setCampaignsLoading":
			return { ...state, isLoading: action.value };
		case "campaignsLoaded":
			return { ...state, campaigns: action.campaigns };
		case "eventsLoaded":
			return { ...state, events: action.events };
		case "ticketsLoaded":
			return { ...state, tickets: action.tickets };
		case "templatesLoaded":
			return { ...state, templates: action.templates };
		case "setCreateModal":
			return { ...state, showCreateModal: action.value };
		case "setFormField":
			return { ...state, formData: { ...state.formData, [action.field]: action.value } };
		case "setFormContent":
			return { ...state, formData: { ...state.formData, content: action.content } };
		case "toggleTargetAudience": {
			const current = state.formData.targetAudience[action.field] as string[];
			const next = action.checked ? [...current, action.id] : current.filter(x => x !== action.id);
			const targetAudience = { ...state.formData.targetAudience, [action.field]: next };
			if (action.field === "eventIds" && next.length > 0) {
				targetAudience.ticketIds = targetAudience.ticketIds.filter(ticketId => {
					const ticket = state.tickets.find(t => t.id === ticketId);
					return ticket && next.includes(ticket.eventId);
				});
			}
			return { ...state, formData: { ...state.formData, targetAudience }, recipientCount: null };
		}
		case "recipientPreviewStarted":
			return { ...state, isCalculating: true };
		case "recipientPreviewLoaded":
			return { ...state, isCalculating: false, recipientCount: action.count, recipientList: action.recipients };
		case "setRecipientsModal":
			return { ...state, showRecipientsModal: action.value };
		case "setSaving":
			return { ...state, isSaving: action.value };
		case "campaignCreated":
			return { ...state, showCreateModal: false, formData: INITIAL_FORM, recipientCount: null, recipientList: [] };
		case "previewLoaded":
			return {
				...state,
				previewHtml: action.html,
				previewRecipients: action.recipients,
				previewTab: "html",
				selectedCampaign: action.campaign,
				showPreviewModal: true
			};
		case "setPreviewModal":
			return { ...state, showPreviewModal: action.value };
		case "setPreviewTab":
			return { ...state, previewTab: action.value };
		case "startSending":
			return { ...state, sendingCampaign: action.campaign };
		case "updateSending":
			return { ...state, sendingCampaign: state.sendingCampaign ? { ...state.sendingCampaign, sent: action.sent, total: action.total } : null };
		case "stopSending":
			return { ...state, sendingCampaign: null };
		case "setTemplateModal":
			return { ...state, showTemplateModal: action.value };
		case "templateImported":
			return { ...state, formData: { ...state.formData, content: action.content }, showTemplateModal: false };
	}
}

const campaignTranslations = {
	title: { "zh-Hant": "郵件發送", "zh-Hans": "邮件发送", en: "Email Campaigns" },
	createNew: { "zh-Hant": "建立新郵件", "zh-Hans": "建立新邮件", en: "Create Campaign" },
	refresh: { "zh-Hant": "重新整理", "zh-Hans": "刷新", en: "Refresh" },
	loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
	name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
	subject: { "zh-Hant": "主旨", "zh-Hans": "主旨", en: "Subject" },
	status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
	recipients: { "zh-Hant": "收件人", "zh-Hans": "收件人", en: "Recipients" },
	createdAt: { "zh-Hant": "建立時間", "zh-Hans": "建立时间", en: "Created" },
	preview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
	send: { "zh-Hant": "發送", "zh-Hans": "发送", en: "Send" },
	cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
	close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
	save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
	content: { "zh-Hant": "內容", "zh-Hans": "内容", en: "Content" },
	targetAudience: { "zh-Hant": "目標受眾", "zh-Hans": "目标受众", en: "Target Audience" },
	selectEvents: { "zh-Hant": "篩選活動（不選則全部）", "zh-Hans": "筛选活动（不选则全部）", en: "Filter by Event (leave empty for all)" },
	selectTickets: { "zh-Hant": "篩選票種（不選則全部）", "zh-Hans": "筛选票种（不选则全部）", en: "Filter by Ticket (leave empty for all)" },
	confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
	pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
	cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
	draft: { "zh-Hant": "草稿", "zh-Hans": "草稿", en: "Draft" },
	sent: { "zh-Hant": "已發送", "zh-Hans": "已发送", en: "Sent" },
	sending: { "zh-Hant": "發送中", "zh-Hans": "发送中", en: "Sending" },
	previewRecipients: { "zh-Hant": "預覽收件人", "zh-Hans": "预览收件人", en: "Preview Recipients" },
	recipientCountLabel: { "zh-Hant": "符合條件的收件人", "zh-Hans": "符合条件的收件人", en: "Matching Recipients" },
	viewRecipients: { "zh-Hant": "查看名單", "zh-Hans": "查看名单", en: "View List" },
	confirmSend: { "zh-Hant": "確認發送", "zh-Hans": "确认发送", en: "Confirm Send" },
	insertVar: { "zh-Hant": "點擊插入變數", "zh-Hans": "点击插入变量", en: "Click to insert variable" },
	importTemplate: { "zh-Hant": "匯入模板", "zh-Hans": "导入模板", en: "Import Template" },
	templates: { "zh-Hant": "郵件模板", "zh-Hans": "邮件模板", en: "Email Templates" },
	sending_progress: { "zh-Hant": "發送進度", "zh-Hans": "发送进度", en: "Sending Progress" }
};

type CampaignTranslations = Record<string, string>;
type CampaignDialogsProps = {
	state: CampaignsState;
	contentRef: React.RefObject<HTMLTextAreaElement | null>;
	visibleTickets: Ticket[];
	locale: string;
	t: CampaignTranslations;
	dispatch: React.Dispatch<CampaignsAction>;
	toggleCheckbox: (field: keyof Pick<TargetAudienceForm, "eventIds" | "ticketIds" | "registrationStatuses">, id: string, checked: boolean) => void;
	insertVariable: (variable: string) => void;
	handlePreviewRecipients: () => void;
	handleCreate: () => void;
	handleImportTemplate: (template: Template) => void;
};

function CampaignDialogs({
	state,
	contentRef,
	visibleTickets,
	locale,
	t,
	dispatch,
	toggleCheckbox,
	insertVariable,
	handlePreviewRecipients,
	handleCreate,
	handleImportTemplate
}: CampaignDialogsProps) {
	const {
		showCreateModal,
		formData,
		recipientCount,
		recipientList,
		isCalculating,
		isSaving,
		showPreviewModal,
		selectedCampaign,
		previewHtml,
		previewRecipients,
		previewTab,
		showRecipientsModal,
		showTemplateModal,
		templates,
		events
	} = state;
	return (
		<>
			{/* Create Campaign Modal */}
			<Dialog open={showCreateModal} onOpenChange={value => dispatch({ type: "setCreateModal", value })}>
				<DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t.createNew}</DialogTitle>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<div className="space-y-2">
							<Label>{t.name}</Label>
							<Input value={formData.name} onChange={e => dispatch({ type: "setFormField", field: "name", value: e.target.value })} placeholder="2026 SITCON 大會通知" />
						</div>
						<div className="space-y-2">
							<Label>{t.subject}</Label>
							<Input value={formData.subject} onChange={e => dispatch({ type: "setFormField", field: "subject", value: e.target.value })} placeholder="【SITCON 2026】活動通知" />
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label>{t.content}</Label>
								<Button variant="outline" size="sm" onClick={() => dispatch({ type: "setTemplateModal", value: true })}>
									<FileText className="h-3 w-3 mr-1" />
									{t.importTemplate}
								</Button>
							</div>
							<Textarea
								ref={contentRef}
								value={formData.content}
								onChange={e => dispatch({ type: "setFormField", field: "content", value: e.target.value })}
								className="w-full min-h-[200px] font-mono text-sm"
								placeholder="<h1>Hello {{name}}!</h1>"
							/>
							{/* Variable insertion chips */}
							<div className="space-y-1.5">
								<p className="text-xs text-muted-foreground">{t.insertVar}</p>
								<div className="flex flex-wrap gap-1.5">
									{TEMPLATE_VARIABLES.map(v => (
										<button
											key={v.key}
											type="button"
											title={v.description}
											onClick={() => insertVariable(v.key)}
											className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-mono cursor-pointer border-0 transition-colors ${VARIABLE_CATEGORY_COLORS[v.category]}`}
										>
											{v.label}
										</button>
									))}
								</div>
								<p className="text-xs text-muted-foreground/60">身份: 藍 &nbsp;·&nbsp; 活動: 綠 &nbsp;·&nbsp; 票種: 橘 &nbsp;·&nbsp; 報名: 紫</p>
							</div>
						</div>

						{/* Target Audience */}
						<div className="space-y-3 border rounded-lg p-4">
							<Label className="text-base font-semibold">{t.targetAudience}</Label>

							{/* Events */}
							<div className="space-y-1">
								<Label className="text-sm text-muted-foreground">{t.selectEvents}</Label>
								<div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
									{events.map(event => (
										<Label key={event.id} className="flex items-center gap-2 cursor-pointer font-normal">
											<Checkbox checked={formData.targetAudience.eventIds.includes(event.id)} onCheckedChange={checked => toggleCheckbox("eventIds", event.id, !!checked)} />
											<span className="text-sm">{getLocalizedText(event.name, locale)}</span>
										</Label>
									))}
									{events.length === 0 && <p className="text-sm text-muted-foreground">沒有活動</p>}
								</div>
							</div>

							{/* Tickets */}
							<div className="space-y-1">
								<Label className="text-sm text-muted-foreground">{t.selectTickets}</Label>
								<div className="border rounded-md p-3 max-h-36 overflow-y-auto space-y-2">
									{visibleTickets.map(ticket => (
										<Label key={ticket.id} className="flex items-center gap-2 cursor-pointer font-normal">
											<Checkbox checked={formData.targetAudience.ticketIds.includes(ticket.id)} onCheckedChange={checked => toggleCheckbox("ticketIds", ticket.id, !!checked)} />
											<span className="text-sm">{getLocalizedText(ticket.name, locale)}</span>
										</Label>
									))}
									{visibleTickets.length === 0 && <p className="text-sm text-muted-foreground">{formData.targetAudience.eventIds.length > 0 ? "所選活動沒有票種" : "沒有票種"}</p>}
								</div>
							</div>

							{/* Registration Status */}
							<div className="space-y-1">
								<Label className="text-sm text-muted-foreground">報名狀態篩選（不選則預設已確認）</Label>
								<div className="flex flex-wrap gap-4">
									{(["confirmed", "pending", "cancelled"] as const).map(status => (
										<Label key={status} className="flex items-center gap-2 cursor-pointer font-normal">
											<Checkbox checked={formData.targetAudience.registrationStatuses.includes(status)} onCheckedChange={checked => toggleCheckbox("registrationStatuses", status, !!checked)} />
											{t[status]}
										</Label>
									))}
								</div>
							</div>
						</div>

						{/* Recipient preview result */}
						{recipientCount !== null && (
							<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<span className="font-medium">{t.recipientCountLabel}:</span>
									<Badge variant="secondary" className="text-base px-3">
										{recipientCount}
									</Badge>
								</div>
								{recipientList.length > 0 && (
									<Button variant="outline" size="sm" onClick={() => dispatch({ type: "setRecipientsModal", value: true })}>
										{t.viewRecipients}
									</Button>
								)}
							</div>
						)}
					</div>

					<DialogFooter className="flex flex-wrap gap-2">
						<Button variant="outline" onClick={handlePreviewRecipients} disabled={isCalculating}>
							{isCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Users className="h-4 w-4 mr-1" />}
							{t.previewRecipients}
						</Button>
						<Button onClick={handleCreate} disabled={isSaving}>
							{isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
							{t.save}
						</Button>
						<Button variant="destructive" onClick={() => dispatch({ type: "setCreateModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Preview Modal */}
			<Dialog open={showPreviewModal} onOpenChange={value => dispatch({ type: "setPreviewModal", value })}>
				<DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle>
							{t.preview}: {selectedCampaign?.subject}
						</DialogTitle>
						{/* Tab switcher */}
						<div className="flex gap-1 mt-2 border-b">
							<button
								type="button"
								onClick={() => dispatch({ type: "setPreviewTab", value: "html" })}
								className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${previewTab === "html" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
							>
								郵件預覽
							</button>
							<button
								type="button"
								onClick={() => dispatch({ type: "setPreviewTab", value: "recipients" })}
								className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${previewTab === "recipients" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
							>
								<Users className="h-3.5 w-3.5" />
								收件人名單
								<Badge variant="secondary" className="text-xs px-1.5 py-0">
									{previewRecipients.length}
								</Badge>
							</button>
						</div>
					</DialogHeader>

					{previewTab === "html" ? (
						<div className="p-4 bg-white text-black rounded-lg overflow-auto flex-1 min-h-0 max-h-[60vh]">
							<iframe title={selectedCampaign?.subject || t.preview} srcDoc={previewHtml} sandbox="" className="w-full min-h-[55vh] border-0" />
						</div>
					) : (
						<div className="overflow-auto flex-1 min-h-0 max-h-[60vh]">
							{previewRecipients.length === 0 ? (
								<p className="text-muted-foreground text-sm p-4">無符合收件人</p>
							) : (
								<div className="space-y-0.5 p-1">
									{previewRecipients.map((r, i) => (
										<div key={r.id} className="flex items-center gap-3 px-3 py-1.5 rounded hover:bg-muted text-sm">
											<span className="text-muted-foreground w-8 text-right shrink-0">{i + 1}</span>
											<span className="font-mono">{r.email}</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<DialogFooter>
						<Button variant="secondary" onClick={() => dispatch({ type: "setPreviewModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Recipients detail modal */}
			<Dialog open={showRecipientsModal} onOpenChange={value => dispatch({ type: "setRecipientsModal", value })}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t.recipientCountLabel} ({recipientCount})
						</DialogTitle>
					</DialogHeader>
					<div className="max-h-[60vh] overflow-y-auto space-y-1">
						{recipientList.map(r => (
							<div key={r.id} className="text-sm py-1 px-2 rounded hover:bg-muted font-mono">
								{r.email}
							</div>
						))}
						{recipientList.length === 0 && <p className="text-muted-foreground text-sm">無符合收件人</p>}
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={() => dispatch({ type: "setRecipientsModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Template import modal */}
			<Dialog open={showTemplateModal} onOpenChange={value => dispatch({ type: "setTemplateModal", value })}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t.templates}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 max-h-[60vh] overflow-y-auto">
						{templates.map(tpl => (
							<div key={tpl.id} className="border rounded-lg p-4 flex items-start justify-between gap-4">
								<div>
									<p className="font-medium">{tpl.name}</p>
									{tpl.description && <p className="text-sm text-muted-foreground">{tpl.description}</p>}
								</div>
								<Button size="sm" onClick={() => handleImportTemplate(tpl)}>
									{t.importTemplate}
								</Button>
							</div>
						))}
						{templates.length === 0 && <p className="text-muted-foreground">沒有可用模板</p>}
					</div>
					<DialogFooter>
						<Button variant="secondary" onClick={() => dispatch({ type: "setTemplateModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function CampaignProgress({ campaign, t }: { campaign: SendingCampaign | null; t: CampaignTranslations }) {
	if (!campaign) return null;

	return (
		<div className="my-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
			<div className="flex items-center gap-2 mb-2">
				<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
				<span className="font-medium text-blue-800 dark:text-blue-200">
					{t.sending_progress}: 「{campaign.name}」
				</span>
			</div>
			<Progress value={campaign.total > 0 ? (campaign.sent / campaign.total) * 100 : 0} className="h-2 mb-1" />
			<span className="text-sm text-blue-600 dark:text-blue-400">
				{campaign.sent} / {campaign.total}
			</span>
		</div>
	);
}

function CampaignActions({ t, onCreate, onRefresh }: { t: CampaignTranslations; onCreate: () => void; onRefresh: () => void }) {
	return (
		<section className="flex gap-2 my-4">
			<Button onClick={onCreate}>
				<Mail /> {t.createNew}
			</Button>
			<Button variant="secondary" onClick={onRefresh}>
				<RotateCw /> {t.refresh}
			</Button>
		</section>
	);
}

function CampaignTable({ isLoading, columns, data, t }: { isLoading: boolean; columns: ReturnType<typeof createCampaignsColumns>; data: CampaignDisplay[]; t: CampaignTranslations }) {
	return (
		<section>
			{isLoading ? (
				<div className="flex flex-col items-center justify-center py-8">
					<PageSpinner />
					<p>{t.loading}</p>
				</div>
			) : (
				<DataTable columns={columns} data={data} />
			)}
		</section>
	);
}

export default function EmailCampaignsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [state, dispatch] = useReducer(campaignsReducer, initialCampaignsState);
	const {
		campaigns,
		isLoading,
		showCreateModal,
		formData,
		isSaving,
		recipientCount,
		recipientList,
		isCalculating,
		showRecipientsModal,
		templates,
		showTemplateModal,
		showPreviewModal,
		selectedCampaign,
		previewHtml,
		previewRecipients,
		previewTab,
		sendingCampaign,
		events,
		tickets
	} = state;
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Textarea ref for variable insertion at cursor
	const contentRef = useRef<HTMLTextAreaElement>(null);

	const t = getTranslations(locale, campaignTranslations);

	const loadCampaigns = useCallback(async () => {
		dispatch({ type: "setCampaignsLoading", value: true });
		try {
			const response = await adminEmailCampaignsAPI.getAll();
			if (response.success) {
				dispatch({ type: "campaignsLoaded", campaigns: response.data || [] });
			}
		} catch (error) {
			console.error("Failed to load campaigns:", error);
		} finally {
			dispatch({ type: "setCampaignsLoading", value: false });
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success) dispatch({ type: "eventsLoaded", events: response.data || [] });
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	const loadTickets = useCallback(async () => {
		try {
			const response = await adminTicketsAPI.getAll();
			if (response.success) dispatch({ type: "ticketsLoaded", tickets: response.data || [] });
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, []);

	const loadTemplates = useCallback(async () => {
		try {
			const response = await adminEmailCampaignsAPI.getTemplates();
			if (response.success) dispatch({ type: "templatesLoaded", templates: response.data || [] });
		} catch (error) {
			console.error("Failed to load templates:", error);
		}
	}, []);

	useEffect(() => {
		loadCampaigns();
		loadEvents();
		loadTickets();
		loadTemplates();
	}, [loadCampaigns, loadEvents, loadTickets, loadTemplates]);

	// Filter tickets shown based on selected events
	const visibleTickets = useMemo(() => {
		if (formData.targetAudience.eventIds.length === 0) return tickets;
		return tickets.filter(t => formData.targetAudience.eventIds.includes(t.eventId));
	}, [tickets, formData.targetAudience.eventIds]);

	const handlePreviewRecipients = async () => {
		dispatch({ type: "recipientPreviewStarted" });
		try {
			const response = await adminEmailCampaignsAPI.previewRecipients(buildTargetAudience(formData.targetAudience));
			if (response.success) {
				dispatch({ type: "recipientPreviewLoaded", count: response.data.recipientCount, recipients: response.data.recipients });
			}
		} catch (error) {
			showAlert("計算失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const handleCreate = async () => {
		if (!formData.name || !formData.subject || !formData.content) {
			showAlert("請填寫名稱、主旨和內容", "warning");
			return;
		}
		dispatch({ type: "setSaving", value: true });
		try {
			const response = await adminEmailCampaignsAPI.create({
				name: formData.name,
				subject: formData.subject,
				content: formData.content,
				targetAudience: buildTargetAudience(formData.targetAudience)
			});
			if (response.success) {
				dispatch({ type: "campaignCreated" });
				loadCampaigns();
				showAlert("郵件發送任務已建立", "success");
			}
		} catch (error) {
			showAlert("建立失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			dispatch({ type: "setSaving", value: false });
		}
	};

	const handlePreview = useCallback(
		async (campaign: EmailCampaign) => {
			try {
				const [previewRes, recipientsRes] = await Promise.all([adminEmailCampaignsAPI.preview(campaign.id), adminEmailCampaignsAPI.calculateRecipients(campaign.id)]);
				if (previewRes.success) {
					dispatch({ type: "previewLoaded", campaign, html: previewRes.data.previewHtml, recipients: recipientsRes.success ? recipientsRes.data.recipients : [] });
				}
			} catch (error) {
				showAlert("預覽失敗：" + (error instanceof Error ? error.message : String(error)), "error");
			}
		},
		[showAlert]
	);

	const startProgressPolling = useCallback(
		(campaignId: string, name: string, total: number) => {
			dispatch({ type: "startSending", campaign: { id: campaignId, name, total, sent: 0 } });
			if (pollingRef.current) clearInterval(pollingRef.current);

			pollingRef.current = setInterval(async () => {
				try {
					const res = await adminEmailCampaignsAPI.getStatus(campaignId);
					if (res.success) {
						const { status, sentCount, totalRecipients } = res.data;
						dispatch({ type: "updateSending", sent: sentCount, total: totalRecipients || total });
						if (status === "sent" || status === "draft" || status === "cancelled") {
							if (pollingRef.current) clearInterval(pollingRef.current);
							dispatch({ type: "stopSending" });
							loadCampaigns();
							if (status === "sent") showAlert(`「${name}」發送完成！已發送 ${sentCount} 封`, "success");
							else showAlert(`「${name}」發送失敗，已重置為草稿`, "error");
						}
					}
				} catch (err) {
					console.error("Polling error:", err);
				}
			}, 2000);
		},
		[loadCampaigns, showAlert]
	);

	const handleSend = useCallback(
		async (campaign: EmailCampaign) => {
			if (!confirm(`確認要發送郵件給符合條件的收件人嗎？`)) return;
			try {
				const response = await adminEmailCampaignsAPI.send(campaign.id);
				if (response.success) {
					const { totalCount } = response.data;
					loadCampaigns();
					startProgressPolling(campaign.id, campaign.name, totalCount || 0);
				}
			} catch (error) {
				showAlert("發送失敗：" + (error instanceof Error ? error.message : String(error)), "error");
			}
		},
		[loadCampaigns, showAlert, startProgressPolling]
	);

	const handleCancel = useCallback(
		async (campaign: EmailCampaign) => {
			if (!confirm("確認要取消此郵件發送任務嗎？")) return;
			try {
				await adminEmailCampaignsAPI.cancel(campaign.id);
				showAlert("已取消", "success");
				loadCampaigns();
			} catch (error) {
				showAlert("取消失敗：" + (error instanceof Error ? error.message : String(error)), "error");
			}
		},
		[loadCampaigns, showAlert]
	);

	const handleImportTemplate = (template: Template) => {
		dispatch({ type: "templateImported", content: template.content });
	};

	const insertVariable = (variable: string) => {
		const el = contentRef.current;
		if (!el) {
			dispatch({ type: "setFormContent", content: formData.content + variable });
			return;
		}
		const start = el.selectionStart ?? el.value.length;
		const end = el.selectionEnd ?? el.value.length;
		const newContent = el.value.slice(0, start) + variable + el.value.slice(end);
		dispatch({ type: "setFormContent", content: newContent });
		// Restore cursor position after React re-render
		requestAnimationFrame(() => {
			el.focus();
			el.selectionStart = start + variable.length;
			el.selectionEnd = start + variable.length;
		});
	};

	useEffect(() => {
		const pollingTimer = pollingRef.current;
		return () => {
			if (pollingTimer) clearInterval(pollingTimer);
		};
	}, []);

	const displayCampaigns = useMemo(
		(): CampaignDisplay[] =>
			campaigns.map(campaign => ({
				...campaign,
				statusClass: getStatusBadgeClass(campaign.status),
				statusLabel: (t[campaign.status as keyof typeof t] as string) || campaign.status,
				recipientsDisplay: `${campaign.sentCount || 0} / ${campaign.totalCount || 0}`,
				formattedCreatedAt: new Date(campaign.createdAt).toLocaleString()
			})),
		[campaigns, t]
	);

	const columns = useMemo(
		() =>
			createCampaignsColumns({
				onPreview: handlePreview,
				onSend: handleSend,
				onCancel: handleCancel,
				t: { preview: t.preview, send: t.send, cancel: t.cancel }
			}),
		[t.preview, t.send, t.cancel, handlePreview, handleSend, handleCancel]
	);

	const toggleCheckbox = (field: keyof Pick<TargetAudienceForm, "eventIds" | "ticketIds" | "registrationStatuses">, id: string, checked: boolean) => {
		dispatch({ type: "toggleTargetAudience", field, id, checked });
	};

	return (
		<main>
			<AdminHeader title={t.title} />

			<CampaignProgress campaign={sendingCampaign} t={t} />
			<CampaignActions t={t} onCreate={() => dispatch({ type: "setCreateModal", value: true })} onRefresh={loadCampaigns} />
			<CampaignTable isLoading={isLoading} columns={columns} data={displayCampaigns} t={t} />

			<CampaignDialogs
				state={state}
				contentRef={contentRef}
				visibleTickets={visibleTickets}
				locale={locale}
				t={t}
				dispatch={dispatch}
				toggleCheckbox={toggleCheckbox}
				insertVariable={insertVariable}
				handlePreviewRecipients={handlePreviewRecipients}
				handleCreate={handleCreate}
				handleImportTemplate={handleImportTemplate}
			/>
		</main>
	);
}
