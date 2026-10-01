"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminRolesAPI } from "@/lib/api/endpoints";
import { MAX_ROLE_DESCRIPTION_LENGTH, MAX_ROLE_NAME_LENGTH, PERMISSION_GROUPS, isPermission, type Permission, type Role } from "@sitcontix/types";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

type RoleForm = {
	id: string | null;
	name: string;
	description: string;
	allEvents: boolean;
	permissions: Set<Permission>;
};

const emptyForm: RoleForm = { id: null, name: "", description: "", allEvents: false, permissions: new Set() };

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

export default function RolesPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();

	const t = getTranslations(locale, {
		title: { "zh-Hant": "角色管理", "zh-Hans": "角色管理", en: "Roles" },
		description: {
			"zh-Hant": "建立自訂角色，精確決定每位管理員可以做哪些事。到「使用者管理」把角色指派給使用者。",
			"zh-Hans": "创建自定义角色，精确决定每位管理员可以做哪些事。到「用户管理」把角色指派给用户。",
			en: "Create custom roles to control exactly what each admin can do. Assign them to people under Users."
		},
		newRole: { "zh-Hant": "新增角色", "zh-Hans": "新增角色", en: "New role" },
		editRole: { "zh-Hant": "編輯角色", "zh-Hans": "编辑角色", en: "Edit role" },
		roleDialogDescription: {
			"zh-Hant": "勾選這個角色可以執行的操作。你無法授予自己沒有的權限。",
			"zh-Hans": "勾选这个角色可以执行的操作。你无法授予自己没有的权限。",
			en: "Tick what this role is allowed to do. You can't grant permissions you don't have yourself."
		},
		name: { "zh-Hant": "角色名稱", "zh-Hans": "角色名称", en: "Role name" },
		roleDescription: { "zh-Hant": "說明（選填）", "zh-Hans": "说明（选填）", en: "Description (optional)" },
		allEvents: { "zh-Hant": "可管理所有活動", "zh-Hans": "可管理所有活动", en: "Applies to all events" },
		allEventsHint: {
			"zh-Hant": "關閉時，此角色只能操作指派給該使用者的活動。",
			"zh-Hans": "关闭时，此角色只能操作指派给该用户的活动。",
			en: "When off, this role only works on the events assigned to each user."
		},
		scopeAll: { "zh-Hant": "所有活動", "zh-Hans": "所有活动", en: "All events" },
		scopeAssigned: { "zh-Hant": "指派的活動", "zh-Hans": "指派的活动", en: "Assigned events" },
		permissionsTitle: { "zh-Hant": "權限", "zh-Hans": "权限", en: "Permissions" },
		permissionCount: { "zh-Hant": "{n} 項權限", "zh-Hans": "{n} 项权限", en: "{n} permissions" },
		selectAll: { "zh-Hant": "全選", "zh-Hans": "全选", en: "Select all" },
		globalTag: { "zh-Hant": "不限活動", "zh-Hans": "不限活动", en: "Not per-event" },
		usersCount: { "zh-Hant": "{n} 位使用者", "zh-Hans": "{n} 位用户", en: "{n} users" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		confirmDeleteTitle: { "zh-Hant": "刪除此角色？", "zh-Hans": "删除此角色？", en: "Delete this role?" },
		confirmDeleteDescription: { "zh-Hant": "此操作無法復原。", "zh-Hans": "此操作无法复原。", en: "This can't be undone." },
		noRoles: { "zh-Hant": "還沒有自訂角色", "zh-Hans": "还没有自定义角色", en: "No custom roles yet" },
		noRolesHint: {
			"zh-Hant": "內建的管理員、活動管理員、檢視者角色仍可使用。建立自訂角色來做更細緻的權限控管。",
			"zh-Hans": "内置的管理员、活动管理员、查看者角色仍可使用。创建自定义角色来做更细致的权限控制。",
			en: "The built-in Admin, Event Admin and Viewer roles keep working. Create a custom role for finer control."
		},
		noPermissionsWarning: {
			"zh-Hant": "尚未勾選任何權限，此角色的使用者將無法進入後台。",
			"zh-Hans": "尚未勾选任何权限，此角色的用户将无法进入后台。",
			en: "No permissions selected: people with this role won't be able to use the admin area."
		},
		nameRequired: { "zh-Hant": "請輸入角色名稱", "zh-Hans": "请输入角色名称", en: "Please enter a role name" },
		saveSuccess: { "zh-Hant": "角色已儲存", "zh-Hans": "角色已保存", en: "Role saved" },
		saveFailed: { "zh-Hant": "儲存角色失敗", "zh-Hans": "保存角色失败", en: "Failed to save role" },
		deleteSuccess: { "zh-Hant": "角色已刪除", "zh-Hans": "角色已删除", en: "Role deleted" },
		deleteFailed: { "zh-Hant": "刪除角色失敗", "zh-Hans": "删除角色失败", en: "Failed to delete role" },
		loadFailed: { "zh-Hant": "無法載入角色列表", "zh-Hans": "无法载入角色列表", en: "Failed to load roles" },
		tryAgain: { "zh-Hant": "重試", "zh-Hans": "重试", en: "Try again" }
	});

	// Labels for the permission matrix
	const groupLabels = getTranslations(locale, {
		dashboard: { "zh-Hant": "報名統計", "zh-Hans": "报名统计", en: "Statistics" },
		events: { "zh-Hant": "活動", "zh-Hans": "活动", en: "Events" },
		tickets: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket types" },
		forms: { "zh-Hant": "報名表單", "zh-Hans": "报名表单", en: "Forms" },
		invitationCodes: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invitation codes" },
		sponsors: { "zh-Hant": "廠商廣告", "zh-Hans": "厂商广告", en: "Sponsors" },
		webhooks: { "zh-Hant": "Webhook", "zh-Hans": "Webhook", en: "Webhooks" },
		registrations: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
		emailCampaigns: { "zh-Hant": "郵件發送", "zh-Hans": "邮件发送", en: "Email campaigns" },
		referrals: { "zh-Hant": "推薦活動", "zh-Hans": "推荐活动", en: "Referrals" },
		smsLogs: { "zh-Hant": "簡訊驗證紀錄", "zh-Hans": "短信验证记录", en: "SMS logs" },
		settings: { "zh-Hant": "網站設定", "zh-Hans": "网站设置", en: "Site settings" },
		users: { "zh-Hant": "使用者", "zh-Hans": "用户", en: "Users" },
		roles: { "zh-Hant": "角色", "zh-Hans": "角色", en: "Roles" }
	});

	const actionLabels = getTranslations(locale, {
		view: { "zh-Hant": "查看", "zh-Hans": "查看", en: "View" },
		create: { "zh-Hant": "建立", "zh-Hans": "创建", en: "Create" },
		update: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		send: { "zh-Hant": "發送", "zh-Hans": "发送", en: "Send" },
		manage: { "zh-Hant": "管理", "zh-Hans": "管理", en: "Manage" },
		export: { "zh-Hant": "匯出", "zh-Hans": "导出", en: "Export" },
		draw: { "zh-Hant": "抽獎", "zh-Hans": "抽奖", en: "Draw" }
	});

	// Extra explanation for permissions whose name alone is ambiguous
	const hints = getTranslations(locale, {
		"events:create": { "zh-Hant": "建立後會自動加入該使用者可管理的活動", "zh-Hans": "创建后会自动加入该用户可管理的活动", en: "New events are added to the creator's assigned events" },
		"invitationCodes:send": { "zh-Hant": "以電子郵件寄送邀請碼", "zh-Hans": "以电子邮件发送邀请码", en: "Email invitation codes" },
		"webhooks:manage": { "zh-Hant": "設定、測試與重送 Webhook", "zh-Hans": "设置、测试与重发 Webhook", en: "Configure, test and retry webhooks" },
		"registrations:update": { "zh-Hant": "變更報名狀態與資料", "zh-Hans": "变更报名状态与资料", en: "Change registration status and data" },
		"registrations:export": { "zh-Hant": "CSV 匯出與 Google Sheets 同步", "zh-Hans": "CSV 导出与 Google Sheets 同步", en: "CSV export and Google Sheets sync" },
		"emailCampaigns:send": { "zh-Hant": "實際寄出郵件給收件者", "zh-Hans": "实际发出邮件给收件人", en: "Actually send emails to recipients" },
		"referrals:draw": { "zh-Hant": "從合格推薦者中抽出得獎者", "zh-Hans": "从合格推荐者中抽出得奖者", en: "Draw winners from qualified referrers" },
		"users:update": { "zh-Hant": "變更使用者的角色、狀態與可管理的活動", "zh-Hans": "变更用户的角色、状态与可管理的活动", en: "Change users' role, status and events" },
		"roles:manage": { "zh-Hant": "建立、編輯、刪除自訂角色", "zh-Hans": "创建、编辑、删除自定义角色", en: "Create, edit and delete custom roles" }
	});

	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	const [form, setForm] = useState<RoleForm | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const load = useCallback(async () => {
		setLoadError(false);
		try {
			const response = await adminRolesAPI.getAll();
			if (response.success && response.data) setRoles(response.data);
			else setLoadError(true);
		} catch (error) {
			console.error("Failed to load roles:", error);
			setLoadError(true);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const openCreate = () => setForm({ ...emptyForm, permissions: new Set() });

	const openEdit = (role: Role) =>
		setForm({
			id: role.id,
			name: role.name,
			description: role.description ?? "",
			allEvents: role.allEvents,
			permissions: new Set(role.permissions.filter(isPermission))
		});

	const togglePermission = (permission: Permission) =>
		setForm(current => {
			if (!current) return current;
			const permissions = new Set(current.permissions);
			if (permissions.has(permission)) permissions.delete(permission);
			else permissions.add(permission);
			return { ...current, permissions };
		});

	const toggleGroup = (keys: Permission[]) =>
		setForm(current => {
			if (!current) return current;
			const permissions = new Set(current.permissions);
			const allSelected = keys.every(key => permissions.has(key));
			for (const key of keys) {
				if (allSelected) permissions.delete(key);
				else permissions.add(key);
			}
			return { ...current, permissions };
		});

	async function handleSave(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!form || isSaving) return;

		const name = form.name.trim();
		if (!name) {
			showAlert(t.nameRequired, "error");
			return;
		}

		const payload = { name, description: form.description.trim() || null, allEvents: form.allEvents, permissions: [...form.permissions] };

		setIsSaving(true);
		try {
			const response = form.id ? await adminRolesAPI.update(form.id, payload) : await adminRolesAPI.create(payload);
			if (!response.success) {
				showAlert(`${t.saveFailed}${response.message ? `: ${response.message}` : ""}`, "error");
				return;
			}
			setForm(null);
			showAlert(t.saveSuccess, "success");
			await load();
		} catch (error) {
			showAlert(`${t.saveFailed}: ${getErrorMessage(error)}`, "error");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete(role: Role) {
		if (!(await confirm({ title: t.confirmDeleteTitle, description: `${role.name} — ${t.confirmDeleteDescription}`, destructive: true, confirmLabel: t.delete }))) return;

		try {
			const response = await adminRolesAPI.delete(role.id);
			if (!response.success) {
				showAlert(`${t.deleteFailed}${response.message ? `: ${response.message}` : ""}`, "error");
				return;
			}
			showAlert(t.deleteSuccess, "success");
			await load();
		} catch (error) {
			showAlert(`${t.deleteFailed}: ${getErrorMessage(error)}`, "error");
		}
	}

	const permissionMatrix = useMemo(
		() =>
			PERMISSION_GROUPS.map(group => ({
				key: group.key,
				label: groupLabels[group.key],
				keys: group.permissions.map(permission => permission.key),
				permissions: group.permissions
			})),
		[groupLabels]
	);

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.description}
				actions={
					<Button type="button" variant="primary" size="sm" onClick={openCreate}>
						<Plus className="size-4" />
						{t.newRole}
					</Button>
				}
			/>

			{loadError ? (
				<EmptyState
					icon={ShieldCheck}
					title={t.loadFailed}
					action={
						<Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
							{t.tryAgain}
						</Button>
					}
				/>
			) : !isLoading && roles.length === 0 ? (
				<EmptyState icon={ShieldCheck} title={t.noRoles} description={t.noRolesHint} />
			) : (
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={isLoading}>
					{roles.map(role => (
						<li key={role.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h2 className="truncate text-lg font-semibold">{role.name}</h2>
									{role.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{role.description}</p>}
								</div>
								<div className="flex shrink-0 gap-1">
									<Button type="button" variant="ghost" size="icon" aria-label={t.edit} onClick={() => openEdit(role)}>
										<Pencil className="size-4" />
									</Button>
									<Button type="button" variant="ghost" size="icon" aria-label={t.delete} onClick={() => void handleDelete(role)}>
										<Trash2 className="size-4" />
									</Button>
								</div>
							</div>
							<div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
								<StatusBadge tone={role.allEvents ? "info" : "warning"}>{role.allEvents ? t.scopeAll : t.scopeAssigned}</StatusBadge>
								<span className="text-muted-foreground">{t.permissionCount.replace("{n}", String(role.permissions.length))}</span>
								<span className="text-muted-foreground">·</span>
								<span className="text-muted-foreground">{t.usersCount.replace("{n}", String(role.userCount ?? 0))}</span>
							</div>
						</li>
					))}
				</ul>
			)}

			<Dialog open={form !== null} onOpenChange={open => !open && setForm(null)}>
				<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{form?.id ? t.editRole : t.newRole}</DialogTitle>
						<DialogDescription>{t.roleDialogDescription}</DialogDescription>
					</DialogHeader>
					{form && (
						<form onSubmit={handleSave} className="space-y-5">
							<div className="space-y-2">
								<Label htmlFor="role-name">{t.name}</Label>
								<Input id="role-name" value={form.name} maxLength={MAX_ROLE_NAME_LENGTH} onChange={e => setForm({ ...form, name: e.target.value })} required />
							</div>

							<div className="space-y-2">
								<Label htmlFor="role-description">{t.roleDescription}</Label>
								<Textarea id="role-description" value={form.description} maxLength={MAX_ROLE_DESCRIPTION_LENGTH} rows={2} onChange={e => setForm({ ...form, description: e.target.value })} />
							</div>

							<Label htmlFor="role-all-events" className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal">
								<Checkbox id="role-all-events" className="mt-0.5" checked={form.allEvents} onCheckedChange={checked => setForm({ ...form, allEvents: checked === true })} />
								<span>
									<span className="block font-medium">{t.allEvents}</span>
									<span className="block text-sm text-muted-foreground">{t.allEventsHint}</span>
								</span>
							</Label>

							<fieldset className="space-y-3">
								<legend className="mb-2 flex w-full items-center justify-between gap-2 text-md font-bold">
									{t.permissionsTitle}
									<span className="text-xs font-normal text-muted-foreground">{t.permissionCount.replace("{n}", String(form.permissions.size))}</span>
								</legend>

								{permissionMatrix.map(group => {
									const selectedCount = group.keys.filter(key => form.permissions.has(key)).length;
									return (
										<div key={group.key} className="rounded-lg border">
											<div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
												<span className="font-medium">{group.label}</span>
												<Label className="flex cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground">
													<Checkbox checked={selectedCount === group.keys.length ? true : selectedCount > 0 ? "indeterminate" : false} onCheckedChange={() => toggleGroup(group.keys)} />
													{t.selectAll}
												</Label>
											</div>
											<div className="grid gap-x-4 gap-y-1 p-3 sm:grid-cols-2">
												{group.permissions.map(permission => (
													<Label key={permission.key} htmlFor={`perm-${permission.key}`} className="flex cursor-pointer items-start gap-2 py-1 font-normal">
														<Checkbox id={`perm-${permission.key}`} className="mt-0.5" checked={form.permissions.has(permission.key)} onCheckedChange={() => togglePermission(permission.key)} />
														<span className="leading-snug">
															{actionLabels[permission.action]}
															{permission.scope === "global" && group.permissions.some(other => other.scope !== "global") && (
																<span className="ml-1.5 text-xs text-muted-foreground">({t.globalTag})</span>
															)}
															{hints[permission.key] && <span className="block text-xs text-muted-foreground">{hints[permission.key]}</span>}
														</span>
													</Label>
												))}
											</div>
										</div>
									);
								})}

								{form.permissions.size === 0 && <p className="text-sm text-amber-700 dark:text-amber-400">{t.noPermissionsWarning}</p>}
							</fieldset>

							<DialogFooter>
								<Button type="button" variant="secondary" onClick={() => setForm(null)}>
									{t.cancel}
								</Button>
								<Button type="submit" variant="primary" isLoading={isSaving}>
									{t.save}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>
		</main>
	);
}
