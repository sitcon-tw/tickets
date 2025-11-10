"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEmailCampaignsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { EmailCampaign, Event, Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createCampaignsColumns, type CampaignDisplay } from "./columns";

export default function EmailCampaignsPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showPreviewModal, setShowPreviewModal] = useState(false);
	const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
	const [previewHtml, setPreviewHtml] = useState("");
	const [recipientCount, setRecipientCount] = useState<number | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [formData, setFormData] = useState({
		name: "",
		subject: "",
		content: "",
		targetAudience: {
			eventIds: [] as string[],
			ticketIds: [] as string[],
			registrationStatuses: [] as string[],
			hasReferrals: undefined as boolean | undefined,
			isReferrer: undefined as boolean | undefined,
			emailDomains: [] as string[]
		}
	});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "郵件發送", "zh-Hans": "邮件发送", en: "Email Campaigns" },
		createNew: { "zh-Hant": "建立新郵件", "zh-Hans": "建立新邮件", en: "Create Campaign" },
		refresh: { "zh-Hant": "重新整理", "zh-Hans": "刷新", en: "Refresh" },
		loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
		empty: { "zh-Hant": "沒有郵件發送記錄", "zh-Hans": "没有邮件发送记录", en: "No campaigns" },
		name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
		subject: { "zh-Hant": "主旨", "zh-Hans": "主旨", en: "Subject" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		recipients: { "zh-Hant": "收件人", "zh-Hans": "收件人", en: "Recipients" },
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "建立时间", en: "Created" },
		actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
		preview: { "zh-Hant": "預覽", "zh-Hans": "预览", en: "Preview" },
		send: { "zh-Hant": "發送", "zh-Hans": "发送", en: "Send" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		content: { "zh-Hant": "內容", "zh-Hans": "内容", en: "Content" },
		targetAudience: { "zh-Hant": "目標受眾", "zh-Hans": "目标受众", en: "Target Audience" },
		selectEvents: { "zh-Hant": "選擇活動", "zh-Hans": "选择活动", en: "Select Events" },
		selectTickets: { "zh-Hant": "選擇票種", "zh-Hans": "选择票种", en: "Select Tickets" },
		allEvents: { "zh-Hant": "所有活動", "zh-Hans": "所有活动", en: "All Events" },
		confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
		pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
		cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
		draft: { "zh-Hant": "草稿", "zh-Hans": "草稿", en: "Draft" },
		sent: { "zh-Hant": "已發送", "zh-Hans": "已发送", en: "Sent" },
		sending: { "zh-Hant": "發送中", "zh-Hans": "发送中", en: "Sending" },
		scheduled: { "zh-Hant": "已排程", "zh-Hans": "已排程", en: "Scheduled" },
		calculateRecipients: { "zh-Hant": "計算收件人", "zh-Hans": "计算收件人", en: "Calculate Recipients" },
		recipientCountLabel: { "zh-Hant": "收件人數量", "zh-Hans": "收件人数量", en: "Recipient Count" },
		confirmSend: { "zh-Hant": "確認發送", "zh-Hans": "确认发送", en: "Confirm Send" },
		hasReferrals: { "zh-Hant": "有推薦人", "zh-Hans": "有推荐人", en: "Has Referrals" },
		isReferrer: { "zh-Hant": "是推薦人", "zh-Hans": "是推荐人", en: "Is Referrer" },
		templateVars: {
			"zh-Hant": "可用變數：{{email}}, {{name}}, {{eventName}}, {{ticketName}}, {{registrationId}}",
			"zh-Hans": "可用变数：{{email}}, {{name}}, {{eventName}}, {{ticketName}}, {{registrationId}}",
			en: "Available variables: {{email}}, {{name}}, {{eventName}}, {{ticketName}}, {{registrationId}}"
		}
	});

	const loadCampaigns = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await adminEmailCampaignsAPI.getAll();
			if (response.success) {
				setCampaigns(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load campaigns:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success) {
				setEvents(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	const loadTickets = useCallback(async () => {
		try {
			const response = await adminTicketsAPI.getAll();
			if (response.success) {
				setTickets(response.data || []);
			}
		} catch (error) {
			console.error("Failed to load tickets:", error);
		}
	}, []);

	useEffect(() => {
		loadCampaigns();
		loadEvents();
		loadTickets();
	}, [loadCampaigns, loadEvents, loadTickets]);

	const handleCreate = async () => {
		try {
			const response = await adminEmailCampaignsAPI.create({
				...formData,
				targetAudience: {
					...formData.targetAudience,
					eventIds: formData.targetAudience.eventIds.length > 0 ? formData.targetAudience.eventIds : undefined,
					ticketIds: formData.targetAudience.ticketIds.length > 0 ? formData.targetAudience.ticketIds : undefined,
					registrationStatuses: formData.targetAudience.registrationStatuses.length > 0 ? formData.targetAudience.registrationStatuses : undefined,
					emailDomains: formData.targetAudience.emailDomains.length > 0 ? formData.targetAudience.emailDomains : undefined
				}
			});
			if (response.success) {
				setShowCreateModal(false);
				setFormData({
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
				});
				setRecipientCount(null);
				loadCampaigns();
				showAlert("郵件發送任務已建立", "success");
			}
		} catch (error) {
			showAlert("建立失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const handlePreview = async (campaign: EmailCampaign) => {
		try {
			const response = await adminEmailCampaignsAPI.preview(campaign.id);
			if (response.success) {
				setPreviewHtml(response.data.previewHtml);
				setSelectedCampaign(campaign);
				setShowPreviewModal(true);
			}
		} catch (error) {
			showAlert("預覽失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const handleCalculateRecipients = async () => {
		if (!formData.name || !formData.subject || !formData.content) {
			showAlert("請先填寫名稱、主旨和內容", "warning");
			return;
		}

		try {
			const createResponse = await adminEmailCampaignsAPI.create({
				...formData,
				targetAudience: {
					...formData.targetAudience,
					eventIds: formData.targetAudience.eventIds.length > 0 ? formData.targetAudience.eventIds : undefined,
					ticketIds: formData.targetAudience.ticketIds.length > 0 ? formData.targetAudience.ticketIds : undefined,
					registrationStatuses: formData.targetAudience.registrationStatuses.length > 0 ? formData.targetAudience.registrationStatuses : undefined,
					emailDomains: formData.targetAudience.emailDomains.length > 0 ? formData.targetAudience.emailDomains : undefined
				}
			});

			if (createResponse.success) {
				const campaign = createResponse.data;
				const response = await adminEmailCampaignsAPI.calculateRecipients(campaign.id);
				if (response.success) {
					setRecipientCount(response.data.recipientCount);
				}
			}
		} catch (error) {
			showAlert("計算失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const handleSend = async (campaign: EmailCampaign) => {
		if (!confirm(`確認要發送郵件給 ${campaign.totalCount || "?"} 位收件人嗎？`)) {
			return;
		}

		try {
			const response = await adminEmailCampaignsAPI.send(campaign.id, true);
			if (response.success) {
				showAlert("郵件已發送！", "success");
				loadCampaigns();
			}
		} catch (error) {
			showAlert("發送失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const handleCancel = async (campaign: EmailCampaign) => {
		if (!confirm("確認要取消此郵件發送任務嗎？")) {
			return;
		}

		try {
			await adminEmailCampaignsAPI.cancel(campaign.id);
			showAlert("已取消", "success");
			loadCampaigns();
		} catch (error) {
			showAlert("取消失敗：" + (error instanceof Error ? error.message : String(error)), "error");
		}
	};

	const getStatusBadgeClass = (status: string) => {
		switch (status) {
			case "sent":
				return "active";
			case "draft":
				return "pending";
			case "sending":
				return "active";
			case "scheduled":
				return "pending";
			case "cancelled":
				return "ended";
			default:
				return "";
		}
	};

	const displayCampaigns = useMemo((): CampaignDisplay[] => {
		return campaigns.map(campaign => ({
			...campaign,
			statusClass: getStatusBadgeClass(campaign.status),
			statusLabel: (t[campaign.status as keyof typeof t] as string) || campaign.status,
			recipientsDisplay: `${campaign.sentCount || 0} / ${campaign.totalCount || 0}`,
			formattedCreatedAt: new Date(campaign.createdAt).toLocaleString()
		}));
	}, [campaigns, t]);

	const columns = useMemo(
		() =>
			createCampaignsColumns({
				onPreview: handlePreview,
				onSend: handleSend,
				onCancel: handleCancel,
				t: {
					preview: t.preview,
					send: t.send,
					cancel: t.cancel
				}
			}),
		[t.preview, t.send, t.cancel]
	);

	return (
		<main>
			<AdminHeader title={t.title} />

			<section className="admin-controls my-4">
				<Button onClick={() => setShowCreateModal(true)}>✉️ {t.createNew}</Button>
				<Button variant="secondary" onClick={loadCampaigns}>
					↻ {t.refresh}
				</Button>
			</section>

			<section>
				{isLoading ? (
					<div className="admin-loading">
						<PageSpinner />
						<p>{t.loading}</p>
					</div>
				) : (
					<DataTable columns={columns} data={displayCampaigns} />
				)}
			</section>

			{/* Modals */}
			{showCreateModal && (
				<div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
					<div className="admin-modal max-w-3xl" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{t.createNew}</h2>
							<Button variant="ghost" size="icon" onClick={() => setShowCreateModal(false)} className="h-8 w-8">
								✕
							</Button>
						</div>

						<div className="flex flex-col gap-4 p-6">
							<div>
								<Label className="admin-stat-label">{t.name}</Label>
								<Input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full" />
							</div>
							<div>
								<Label className="admin-stat-label">{t.subject}</Label>
								<Input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full" />
							</div>
							<div>
								<Label className="admin-stat-label">{t.content}</Label>
								<Textarea
									value={formData.content}
									onChange={e => setFormData({ ...formData, content: e.target.value })}
									className="w-full min-h-[200px] font-mono"
									placeholder="<h1>Hello {{name}}!</h1>"
								/>
								<small className="text-xs opacity-70">{t.templateVars}</small>
							</div>
							<div>
								<Label className="admin-stat-label">{t.targetAudience}</Label>

								<div className="mt-2">
									<Label className="text-sm">{t.selectEvents}</Label>
									<select
										multiple
										value={formData.targetAudience.eventIds}
										onChange={e => {
											const selected = Array.from(e.target.selectedOptions, option => option.value);
											setFormData({
												...formData,
												targetAudience: { ...formData.targetAudience, eventIds: selected }
											});
										}}
										className="w-full min-h-20 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{events.map(event => (
											<option key={event.id} value={event.id}>
												{getLocalizedText(event.name, locale)}
											</option>
										))}
									</select>
								</div>

								<div className="mt-2">
									<Label className="text-sm">{t.selectTickets}</Label>
									<select
										multiple
										value={formData.targetAudience.ticketIds}
										onChange={e => {
											const selected = Array.from(e.target.selectedOptions, option => option.value);
											setFormData({
												...formData,
												targetAudience: { ...formData.targetAudience, ticketIds: selected }
											});
										}}
										className="w-full min-h-20 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										{tickets.map(ticket => (
											<option key={ticket.id} value={ticket.id}>
												{getLocalizedText(ticket.name, locale)}
											</option>
										))}
									</select>
								</div>

								<div className="mt-2 flex gap-4">
									<Label className="flex items-center gap-2">
										<Checkbox
											checked={formData.targetAudience.registrationStatuses.includes("confirmed")}
											onCheckedChange={checked => {
												const statuses = formData.targetAudience.registrationStatuses;
												if (checked) {
													setFormData({
														...formData,
														targetAudience: { ...formData.targetAudience, registrationStatuses: [...statuses, "confirmed"] }
													});
												} else {
													setFormData({
														...formData,
														targetAudience: { ...formData.targetAudience, registrationStatuses: statuses.filter(s => s !== "confirmed") }
													});
												}
											}}
										/>
										{t.confirmed}
									</Label>
									<Label className="flex items-center gap-2">
										<Checkbox
											checked={formData.targetAudience.registrationStatuses.includes("pending")}
											onCheckedChange={checked => {
												const statuses = formData.targetAudience.registrationStatuses;
												if (checked) {
													setFormData({
														...formData,
														targetAudience: { ...formData.targetAudience, registrationStatuses: [...statuses, "pending"] }
													});
												} else {
													setFormData({
														...formData,
														targetAudience: { ...formData.targetAudience, registrationStatuses: statuses.filter(s => s !== "pending") }
													});
												}
											}}
										/>
										{t.pending}
									</Label>
								</div>
							</div>{" "}
							{recipientCount !== null && (
								<div className="p-4 bg-gray-800 dark:bg-gray-900 rounded-lg border-2 border-gray-600 dark:border-gray-700">
									<strong>{t.recipientCountLabel}:</strong> {recipientCount}
								</div>
							)}
							<div className="flex gap-2 justify-end">
								<Button variant="secondary" onClick={handleCalculateRecipients}>
									🔢 {t.calculateRecipients}
								</Button>
								<Button onClick={handleCreate}>💾 {t.save}</Button>
								<Button variant="destructive" onClick={() => setShowCreateModal(false)}>
									{t.close}
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Preview Modal */}
			{showPreviewModal && selectedCampaign && (
				<div className="admin-modal-overlay" onClick={() => setShowPreviewModal(false)}>
					<div className="admin-modal max-w-4xl" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">
								{t.preview}: {selectedCampaign.subject}
							</h2>
							<Button variant="ghost" size="icon" onClick={() => setShowPreviewModal(false)} className="h-8 w-8">
								✕
							</Button>
						</div>

						<div className="p-4 bg-white text-black rounded-lg max-h-[70vh] overflow-auto">
							<div dangerouslySetInnerHTML={{ __html: previewHtml }} />
						</div>

						<div className="flex gap-2 justify-end mt-4 px-6 pb-6">
							<Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
								{t.close}
							</Button>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
