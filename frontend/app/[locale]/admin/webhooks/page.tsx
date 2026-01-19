"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminWebhooksAPI, type WebhookDelivery, type WebhookEndpoint, type WebhookTestResult } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/utils/timezone";
import { AlertTriangle, CheckCircle, ExternalLink, Play, RefreshCw, Settings, Trash2, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

export default function WebhooksPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [webhook, setWebhook] = useState<WebhookEndpoint | null>(null);
	const [failedDeliveries, setFailedDeliveries] = useState<WebhookDelivery[]>([]);
	const [showConfigModal, setShowConfigModal] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showTestResult, setShowTestResult] = useState(false);
	const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);

	// Form state
	const [formUrl, setFormUrl] = useState("");
	const [formAuthHeaderName, setFormAuthHeaderName] = useState("");
	const [formAuthHeaderValue, setFormAuthHeaderValue] = useState("");
	const [formEventTypes, setFormEventTypes] = useState<Set<string>>(new Set(["registration_confirmed", "registration_cancelled"]));

	const t = getTranslations(locale, {
		title: { "zh-Hant": "Webhook 設定", "zh-Hans": "Webhook 设置", en: "Webhook Settings" },
		description: {
			"zh-Hant": "設定 Webhook 以在報名確認或取消時接收通知",
			"zh-Hans": "设置 Webhook 以在报名确认或取消时接收通知",
			en: "Configure webhooks to receive notifications when registrations are confirmed or cancelled"
		},
		noWebhook: { "zh-Hant": "尚未設定 Webhook", "zh-Hans": "尚未设置 Webhook", en: "No webhook configured" },
		noWebhookDesc: {
			"zh-Hant": "建立 Webhook 以在報名狀態變更時自動通知您的系統",
			"zh-Hans": "创建 Webhook 以在报名状态变更时自动通知您的系统",
			en: "Create a webhook to automatically notify your system when registration status changes"
		},
		createWebhook: { "zh-Hant": "建立 Webhook", "zh-Hans": "创建 Webhook", en: "Create Webhook" },
		editWebhook: { "zh-Hant": "編輯 Webhook", "zh-Hans": "编辑 Webhook", en: "Edit Webhook" },
		webhookUrl: { "zh-Hant": "Webhook URL", "zh-Hans": "Webhook URL", en: "Webhook URL" },
		webhookUrlPlaceholder: { "zh-Hant": "https://your-server.com/webhook", "zh-Hans": "https://your-server.com/webhook", en: "https://your-server.com/webhook" },
		webhookUrlHelp: { "zh-Hant": "必須使用 HTTPS 協定", "zh-Hans": "必须使用 HTTPS 协议", en: "Must use HTTPS protocol" },
		authHeader: { "zh-Hant": "認證標頭（選填）", "zh-Hans": "认证标头（选填）", en: "Auth Header (Optional)" },
		authHeaderName: { "zh-Hant": "標頭名稱", "zh-Hans": "标头名称", en: "Header Name" },
		authHeaderNamePlaceholder: { "zh-Hant": "X-Sitcontix-Token", "zh-Hans": "X-Sitcontix-Token", en: "X-Sitcontix-Token" },
		authHeaderValue: { "zh-Hant": "標頭值", "zh-Hans": "标头值", en: "Header Value" },
		authHeaderValuePlaceholder: { "zh-Hant": "your-secret-token", "zh-Hans": "your-secret-token", en: "your-secret-token" },
		eventTypes: { "zh-Hant": "事件類型", "zh-Hans": "事件类型", en: "Event Types" },
		registrationConfirmed: { "zh-Hant": "報名確認", "zh-Hans": "报名确认", en: "Registration Confirmed" },
		registrationCancelled: { "zh-Hant": "報名取消", "zh-Hans": "报名取消", en: "Registration Cancelled" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		active: { "zh-Hant": "啟用", "zh-Hans": "启用", en: "Active" },
		inactive: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Inactive" },
		autoDisabled: { "zh-Hant": "自動停用（連續失敗）", "zh-Hans": "自动停用（连续失败）", en: "Auto-disabled (consecutive failures)" },
		testWebhook: { "zh-Hant": "測試 Webhook", "zh-Hans": "测试 Webhook", en: "Test Webhook" },
		testing: { "zh-Hant": "測試中...", "zh-Hans": "测试中...", en: "Testing..." },
		testSuccess: { "zh-Hant": "測試成功！", "zh-Hans": "测试成功！", en: "Test successful!" },
		testFailed: { "zh-Hant": "測試失敗", "zh-Hans": "测试失败", en: "Test failed" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		saving: { "zh-Hant": "儲存中...", "zh-Hans": "保存中...", en: "Saving..." },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		deleteWebhook: { "zh-Hant": "刪除 Webhook", "zh-Hans": "删除 Webhook", en: "Delete Webhook" },
		deleteConfirm: {
			"zh-Hant": "確定要刪除此 Webhook 嗎？此操作無法復原。",
			"zh-Hans": "确定要删除此 Webhook 吗？此操作无法恢复。",
			en: "Are you sure you want to delete this webhook? This action cannot be undone."
		},
		failedDeliveries: { "zh-Hant": "發送失敗紀錄", "zh-Hans": "发送失败记录", en: "Failed Deliveries" },
		noFailedDeliveries: { "zh-Hant": "沒有失敗紀錄", "zh-Hans": "没有失败记录", en: "No failed deliveries" },
		retry: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Retry" },
		retrying: { "zh-Hant": "重試中...", "zh-Hans": "重试中...", en: "Retrying..." },
		eventType: { "zh-Hant": "事件類型", "zh-Hans": "事件类型", en: "Event Type" },
		statusCode: { "zh-Hant": "狀態碼", "zh-Hans": "状态码", en: "Status Code" },
		errorMessage: { "zh-Hant": "錯誤訊息", "zh-Hans": "错误信息", en: "Error Message" },
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" },
		retryCount: { "zh-Hant": "重試次數", "zh-Hans": "重试次数", en: "Retry Count" },
		actions: { "zh-Hant": "動作", "zh-Hans": "动作", en: "Actions" },
		selectEvent: { "zh-Hant": "請先選擇活動", "zh-Hans": "请先选择活动", en: "Please select an event first" },
		testResultTitle: { "zh-Hant": "測試結果", "zh-Hans": "测试结果", en: "Test Result" },
		responseBody: { "zh-Hant": "回應內容", "zh-Hans": "响应内容", en: "Response Body" },
		close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
		enable: { "zh-Hant": "啟用", "zh-Hans": "启用", en: "Enable" },
		disable: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Disable" }
	});

	const loadWebhook = useCallback(async () => {
		if (!currentEventId) return;

		setIsLoading(true);
		try {
			const response = await adminWebhooksAPI.get(currentEventId);
			if (response.success) {
				setWebhook(response.data || null);
			}
		} catch (error) {
			console.error("Failed to load webhook:", error);
		} finally {
			setIsLoading(false);
		}
	}, [currentEventId]);

	const loadFailedDeliveries = useCallback(async () => {
		if (!currentEventId || !webhook) return;

		try {
			const response = await adminWebhooksAPI.getFailedDeliveries(currentEventId);
			if (response.success && response.data) {
				setFailedDeliveries(response.data);
			}
		} catch (error) {
			console.error("Failed to load failed deliveries:", error);
		}
	}, [currentEventId, webhook]);

	useEffect(() => {
		const savedEventId = localStorage.getItem("selectedEventId");
		if (savedEventId) {
			setCurrentEventId(savedEventId);
		}

		const handleEventChange = (e: CustomEvent) => {
			setCurrentEventId(e.detail.eventId);
		};

		window.addEventListener("selectedEventChanged", handleEventChange as EventListener);
		return () => window.removeEventListener("selectedEventChanged", handleEventChange as EventListener);
	}, []);

	useEffect(() => {
		if (currentEventId) {
			loadWebhook();
		}
	}, [currentEventId, loadWebhook]);

	useEffect(() => {
		if (webhook) {
			loadFailedDeliveries();
		}
	}, [webhook, loadFailedDeliveries]);

	const openConfigModal = (existingWebhook?: WebhookEndpoint) => {
		if (existingWebhook) {
			setFormUrl(existingWebhook.url);
			setFormAuthHeaderName(existingWebhook.authHeaderName || "");
			setFormAuthHeaderValue(""); // Don't populate masked value
			setFormEventTypes(new Set(existingWebhook.eventTypes));
		} else {
			setFormUrl("");
			setFormAuthHeaderName("");
			setFormAuthHeaderValue("");
			setFormEventTypes(new Set(["registration_confirmed", "registration_cancelled"]));
		}
		setShowConfigModal(true);
	};

	const handleTestWebhook = async () => {
		if (!formUrl) {
			showAlert("Please enter a webhook URL", "error");
			return;
		}

		if (!formUrl.startsWith("https://")) {
			showAlert("Webhook URL must use HTTPS", "error");
			return;
		}

		if (!currentEventId) return;

		setIsTesting(true);
		try {
			const response = await adminWebhooksAPI.test(currentEventId, {
				url: formUrl,
				authHeaderName: formAuthHeaderName || undefined,
				authHeaderValue: formAuthHeaderValue || undefined
			});

			if (response.success && response.data) {
				setTestResult(response.data);
				setShowTestResult(true);
			}
		} catch (error) {
			showAlert("Failed to test webhook", "error");
		} finally {
			setIsTesting(false);
		}
	};

	const handleSaveWebhook = async () => {
		if (!formUrl) {
			showAlert("Please enter a webhook URL", "error");
			return;
		}

		if (!formUrl.startsWith("https://")) {
			showAlert("Webhook URL must use HTTPS", "error");
			return;
		}

		if (formEventTypes.size === 0) {
			showAlert("Please select at least one event type", "error");
			return;
		}

		if (!currentEventId) return;

		setIsSaving(true);
		try {
			const data = {
				url: formUrl,
				authHeaderName: formAuthHeaderName || undefined,
				authHeaderValue: formAuthHeaderValue || undefined,
				eventTypes: Array.from(formEventTypes)
			};

			let response;
			if (webhook) {
				response = await adminWebhooksAPI.update(currentEventId, data);
			} else {
				response = await adminWebhooksAPI.create(currentEventId, data);
			}

			if (response.success) {
				showAlert(webhook ? "Webhook updated" : "Webhook created", "success");
				setShowConfigModal(false);
				loadWebhook();
			} else {
				showAlert(response.message || "Failed to save webhook", "error");
			}
		} catch (error) {
			showAlert("Failed to save webhook", "error");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteWebhook = async () => {
		if (!currentEventId) return;

		try {
			const response = await adminWebhooksAPI.delete(currentEventId);
			if (response.success) {
				showAlert("Webhook deleted", "success");
				setWebhook(null);
				setFailedDeliveries([]);
				setShowDeleteConfirm(false);
			} else {
				showAlert(response.message || "Failed to delete webhook", "error");
			}
		} catch (error) {
			showAlert("Failed to delete webhook", "error");
		}
	};

	const handleToggleActive = async () => {
		if (!currentEventId || !webhook) return;

		try {
			const response = await adminWebhooksAPI.update(currentEventId, {
				isActive: !webhook.isActive
			});

			if (response.success) {
				showAlert(webhook.isActive ? "Webhook disabled" : "Webhook enabled", "success");
				loadWebhook();
			}
		} catch (error) {
			showAlert("Failed to update webhook", "error");
		}
	};

	const handleRetryDelivery = async (deliveryId: string) => {
		if (!currentEventId) return;

		try {
			const response = await adminWebhooksAPI.retryDelivery(currentEventId, deliveryId);
			if (response.success) {
				showAlert("Retry successful", "success");
				loadFailedDeliveries();
			} else {
				showAlert("Retry failed", "error");
			}
		} catch (error) {
			showAlert("Retry failed", "error");
		}
	};

	const toggleEventType = (eventType: string) => {
		const newSet = new Set(formEventTypes);
		if (newSet.has(eventType)) {
			newSet.delete(eventType);
		} else {
			newSet.add(eventType);
		}
		setFormEventTypes(newSet);
	};

	if (!currentEventId) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Settings className="h-12 w-12 text-muted-foreground mb-4" />
				<p className="text-muted-foreground">{t.selectEvent}</p>
			</div>
		);
	}

	if (isLoading) {
		return <PageSpinner />;
	}

	return (
		<div className="space-y-6">
			<AdminHeader title={t.title} description={t.description} />

			{/* Webhook Configuration Card */}
			<div className="rounded-lg border bg-card p-6">
				{webhook ? (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<h3 className="text-lg font-semibold">Webhook</h3>
								{webhook.isActive ? (
									webhook.consecutiveFailurePeriods > 0 ? (
										<Badge variant="destructive" className="flex items-center gap-1">
											<AlertTriangle className="h-3 w-3" />
											{t.autoDisabled}
										</Badge>
									) : (
										<Badge variant="default" className="flex items-center gap-1">
											<CheckCircle className="h-3 w-3" />
											{t.active}
										</Badge>
									)
								) : (
									<Badge variant="secondary" className="flex items-center gap-1">
										<XCircle className="h-3 w-3" />
										{t.inactive}
									</Badge>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Button variant="outline" size="sm" onClick={handleToggleActive}>
									{webhook.isActive ? t.disable : t.enable}
								</Button>
								<Button variant="outline" size="sm" onClick={() => openConfigModal(webhook)}>
									<Settings className="h-4 w-4 mr-1" />
									{t.editWebhook}
								</Button>
								<Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
									<Trash2 className="h-4 w-4 mr-1" />
									{t.delete}
								</Button>
							</div>
						</div>

						<div className="grid gap-4 text-sm">
							<div>
								<Label className="text-muted-foreground">{t.webhookUrl}</Label>
								<div className="flex items-center gap-2 mt-1">
									<code className="bg-muted px-2 py-1 rounded text-xs break-all">{webhook.url}</code>
									<a href={webhook.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
										<ExternalLink className="h-4 w-4" />
									</a>
								</div>
							</div>

							{webhook.authHeaderName && (
								<div>
									<Label className="text-muted-foreground">{t.authHeader}</Label>
									<div className="mt-1">
										<code className="bg-muted px-2 py-1 rounded text-xs">
											{webhook.authHeaderName}: {webhook.authHeaderValue}
										</code>
									</div>
								</div>
							)}

							<div>
								<Label className="text-muted-foreground">{t.eventTypes}</Label>
								<div className="flex gap-2 mt-1">
									{webhook.eventTypes.map(type => (
										<Badge key={type} variant="outline">
											{type === "registration_confirmed" ? t.registrationConfirmed : t.registrationCancelled}
										</Badge>
									))}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="text-center py-8">
						<Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h3 className="text-lg font-semibold mb-2">{t.noWebhook}</h3>
						<p className="text-muted-foreground mb-4">{t.noWebhookDesc}</p>
						<Button onClick={() => openConfigModal()}>
							<Plus className="h-4 w-4 mr-1" />
							{t.createWebhook}
						</Button>
					</div>
				)}
			</div>

			{/* Failed Deliveries */}
			{webhook && (
				<div className="rounded-lg border bg-card p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">{t.failedDeliveries}</h3>
						<Button variant="outline" size="sm" onClick={loadFailedDeliveries}>
							<RefreshCw className="h-4 w-4 mr-1" />
							Refresh
						</Button>
					</div>

					{failedDeliveries.length === 0 ? (
						<p className="text-muted-foreground text-center py-4">{t.noFailedDeliveries}</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t.eventType}</TableHead>
									<TableHead>{t.statusCode}</TableHead>
									<TableHead>{t.errorMessage}</TableHead>
									<TableHead>{t.retryCount}</TableHead>
									<TableHead>{t.createdAt}</TableHead>
									<TableHead>{t.actions}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{failedDeliveries.map(delivery => (
									<TableRow key={delivery.id}>
										<TableCell>
											<Badge variant="outline">{delivery.eventType === "registration_confirmed" ? t.registrationConfirmed : t.registrationCancelled}</Badge>
										</TableCell>
										<TableCell>{delivery.statusCode || "-"}</TableCell>
										<TableCell className="max-w-xs truncate">{delivery.errorMessage || "-"}</TableCell>
										<TableCell>{delivery.retryCount}/3</TableCell>
										<TableCell>{formatDateTime(delivery.createdAt)}</TableCell>
										<TableCell>
											<Button variant="outline" size="sm" onClick={() => handleRetryDelivery(delivery.id)}>
												<Play className="h-4 w-4 mr-1" />
												{t.retry}
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</div>
			)}

			{/* Config Modal */}
			<Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{webhook ? t.editWebhook : t.createWebhook}</DialogTitle>
						<DialogDescription>{t.description}</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="webhookUrl">{t.webhookUrl} *</Label>
							<Input id="webhookUrl" type="url" placeholder={t.webhookUrlPlaceholder} value={formUrl} onChange={e => setFormUrl(e.target.value)} />
							<p className="text-xs text-muted-foreground">{t.webhookUrlHelp}</p>
						</div>

						<div className="space-y-2">
							<Label>{t.authHeader}</Label>
							<div className="grid grid-cols-2 gap-2">
								<Input placeholder={t.authHeaderNamePlaceholder} value={formAuthHeaderName} onChange={e => setFormAuthHeaderName(e.target.value)} />
								<Input type="password" placeholder={t.authHeaderValuePlaceholder} value={formAuthHeaderValue} onChange={e => setFormAuthHeaderValue(e.target.value)} />
							</div>
						</div>

						<div className="space-y-2">
							<Label>{t.eventTypes} *</Label>
							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox id="registration_confirmed" checked={formEventTypes.has("registration_confirmed")} onCheckedChange={() => toggleEventType("registration_confirmed")} />
									<label htmlFor="registration_confirmed" className="text-sm cursor-pointer">
										{t.registrationConfirmed}
									</label>
								</div>
								<div className="flex items-center space-x-2">
									<Checkbox id="registration_cancelled" checked={formEventTypes.has("registration_cancelled")} onCheckedChange={() => toggleEventType("registration_cancelled")} />
									<label htmlFor="registration_cancelled" className="text-sm cursor-pointer">
										{t.registrationCancelled}
									</label>
								</div>
							</div>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={handleTestWebhook} disabled={isTesting || !formUrl}>
							{isTesting ? t.testing : t.testWebhook}
						</Button>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowConfigModal(false)}>
								{t.cancel}
							</Button>
							<Button onClick={handleSaveWebhook} disabled={isSaving}>
								{isSaving ? t.saving : t.save}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.deleteWebhook}</DialogTitle>
						<DialogDescription>{t.deleteConfirm}</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
							{t.cancel}
						</Button>
						<Button variant="destructive" onClick={handleDeleteWebhook}>
							{t.delete}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Test Result Modal */}
			<Dialog open={showTestResult} onOpenChange={setShowTestResult}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.testResultTitle}</DialogTitle>
					</DialogHeader>
					{testResult && (
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								{testResult.success ? (
									<>
										<CheckCircle className="h-5 w-5 text-green-500" />
										<span className="text-green-500 font-medium">{t.testSuccess}</span>
									</>
								) : (
									<>
										<XCircle className="h-5 w-5 text-red-500" />
										<span className="text-red-500 font-medium">{t.testFailed}</span>
									</>
								)}
							</div>

							{testResult.statusCode && (
								<div>
									<Label className="text-muted-foreground">{t.statusCode}</Label>
									<p className="font-mono">{testResult.statusCode}</p>
								</div>
							)}

							{testResult.errorMessage && (
								<div>
									<Label className="text-muted-foreground">{t.errorMessage}</Label>
									<p className="text-red-500">{testResult.errorMessage}</p>
								</div>
							)}

							{testResult.responseBody && (
								<div>
									<Label className="text-muted-foreground">{t.responseBody}</Label>
									<pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">{testResult.responseBody}</pre>
								</div>
							)}
						</div>
					)}
					<DialogFooter>
						<Button onClick={() => setShowTestResult(false)}>{t.close}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Plus icon component
function Plus(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
			<path d="M5 12h14" />
			<path d="M12 5v14" />
		</svg>
	);
}
