"use client";

import AdminNav from "@/components/AdminNav";
import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEmailCampaignsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { EmailCampaign, Event, Ticket } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

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
			showAlert("建立失敗: " + (error instanceof Error ? error.message : String(error)), "error");
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
			showAlert("預覽失敗: " + (error instanceof Error ? error.message : String(error)), "error");
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
			showAlert("計算失敗: " + (error instanceof Error ? error.message : String(error)), "error");
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
			showAlert("發送失敗: " + (error instanceof Error ? error.message : String(error)), "error");
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
			showAlert("取消失敗: " + (error instanceof Error ? error.message : String(error)), "error");
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

	return (
		<>
			<AdminNav />
			<main>
				<h1 className="text-3xl font-bold">{t.title}</h1>
				<div className="h-8" />

				<section className="admin-controls" style={{ margin: "1rem 0" }}>
					<button onClick={() => setShowCreateModal(true)} className="admin-button primary">
						✉️ {t.createNew}
					</button>
					<button onClick={loadCampaigns} className="admin-button secondary">
						↻ {t.refresh}
					</button>
				</section>

				<section>
					<div className="admin-table-container">
						{isLoading && (
							<div className="admin-loading">
								<PageSpinner size={48} />
								<p>{t.loading}</p>
							</div>
						)}
						{!isLoading && campaigns.length === 0 && <div className="admin-empty">{t.empty}</div>}
						{!isLoading && campaigns.length > 0 && (
							<table className="admin-table">
								<thead>
									<tr>
										<th>{t.name}</th>
										<th>{t.subject}</th>
										<th>{t.status}</th>
										<th>{t.recipients}</th>
										<th>{t.createdAt}</th>
										<th style={{ width: "200px" }}>{t.actions}</th>
									</tr>
								</thead>
								<tbody>
									{campaigns.map(campaign => (
										<tr key={campaign.id}>
											<td>
												<div className="admin-truncate">{campaign.name}</div>
											</td>
											<td>
												<div className="admin-truncate">{campaign.subject}</div>
											</td>
											<td>
												<span className={`status-badge ${getStatusBadgeClass(campaign.status)}`}>{t[campaign.status as keyof typeof t] || campaign.status}</span>
											</td>
											<td>
												{campaign.sentCount || 0} / {campaign.totalCount || 0}
											</td>
											<td>{new Date(campaign.createdAt).toLocaleString()}</td>
											<td>
												<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
													<button onClick={() => handlePreview(campaign)} className="admin-button small secondary" disabled={campaign.status === "cancelled"}>
														👁 {t.preview}
													</button>
													{campaign.status === "draft" && (
														<button onClick={() => handleSend(campaign)} className="admin-button small primary">
															📤 {t.send}
														</button>
													)}
													{(campaign.status === "draft" || campaign.status === "scheduled") && (
														<button onClick={() => handleCancel(campaign)} className="admin-button small danger">
															✕ {t.cancel}
														</button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</section>
			</main>

			{/* Create Modal */}
			{showCreateModal && (
				<div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
					<div className="admin-modal" style={{ maxWidth: "800px" }} onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{t.createNew}</h2>
							<button className="admin-modal-close" onClick={() => setShowCreateModal(false)}>
								✕
							</button>
						</div>

						<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
							<div>
								<label className="admin-stat-label">{t.name}</label>
								<input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="admin-input" style={{ width: "100%" }} />
							</div>

							<div>
								<label className="admin-stat-label">{t.subject}</label>
								<input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="admin-input" style={{ width: "100%" }} />
							</div>

							<div>
								<label className="admin-stat-label">{t.content}</label>
								<textarea
									value={formData.content}
									onChange={e => setFormData({ ...formData, content: e.target.value })}
									className="admin-input"
									style={{ width: "100%", minHeight: "200px", fontFamily: "monospace" }}
									placeholder="<h1>Hello {{name}}!</h1>"
								/>
								<small style={{ fontSize: "0.75rem", opacity: 0.7 }}>{t.templateVars}</small>
							</div>

							<div>
								<label className="admin-stat-label">{t.targetAudience}</label>

								<div style={{ marginTop: "0.5rem" }}>
									<label style={{ fontSize: "0.85rem" }}>{t.selectEvents}</label>
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
										className="admin-select"
										style={{ width: "100%", minHeight: "80px" }}
									>
										{events.map(event => (
											<option key={event.id} value={event.id}>
												{getLocalizedText(event.name, locale)}
											</option>
										))}
									</select>
								</div>

								<div style={{ marginTop: "0.5rem" }}>
									<label style={{ fontSize: "0.85rem" }}>{t.selectTickets}</label>
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
										className="admin-select"
										style={{ width: "100%", minHeight: "80px" }}
									>
										{tickets.map(ticket => (
											<option key={ticket.id} value={ticket.id}>
												{getLocalizedText(ticket.name, locale)}
											</option>
										))}
									</select>
								</div>

								<div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
									<label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<input
											type="checkbox"
											checked={formData.targetAudience.registrationStatuses.includes("confirmed")}
											onChange={e => {
												const statuses = formData.targetAudience.registrationStatuses;
												if (e.target.checked) {
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
									</label>
									<label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
										<input
											type="checkbox"
											checked={formData.targetAudience.registrationStatuses.includes("pending")}
											onChange={e => {
												const statuses = formData.targetAudience.registrationStatuses;
												if (e.target.checked) {
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
									</label>
								</div>
							</div>

							{recipientCount !== null && (
								<div
									style={{
										padding: "1rem",
										background: "var(--color-gray-800)",
										borderRadius: "8px",
										border: "2px solid var(--color-gray-600)"
									}}
								>
									<strong>{t.recipientCountLabel}:</strong> {recipientCount}
								</div>
							)}

							<div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
								<button onClick={handleCalculateRecipients} className="admin-button secondary">
									🔢 {t.calculateRecipients}
								</button>
								<button onClick={handleCreate} className="admin-button primary">
									💾 {t.save}
								</button>
								<button onClick={() => setShowCreateModal(false)} className="admin-button danger">
									{t.close}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Preview Modal */}
			{showPreviewModal && selectedCampaign && (
				<div className="admin-modal-overlay" onClick={() => setShowPreviewModal(false)}>
					<div className="admin-modal" style={{ maxWidth: "900px" }} onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">
								{t.preview}: {selectedCampaign.subject}
							</h2>
							<button className="admin-modal-close" onClick={() => setShowPreviewModal(false)}>
								✕
							</button>
						</div>

						<div
							style={{
								padding: "1rem",
								background: "white",
								color: "black",
								borderRadius: "8px",
								maxHeight: "70vh",
								overflow: "auto"
							}}
						>
							<div dangerouslySetInnerHTML={{ __html: previewHtml }} />
						</div>

						<div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
							<button onClick={() => setShowPreviewModal(false)} className="admin-button secondary">
								{t.close}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
