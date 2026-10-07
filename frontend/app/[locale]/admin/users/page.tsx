"use client";

import { useConfirm } from "@/components/admin/ConfirmProvider";
import { EmptyState } from "@/components/admin/EmptyState";
import { SearchInput } from "@/components/admin/SearchInput";
import { StatusBadge, type StatusTone } from "@/components/admin/StatusBadge";
import { AdminToolbar, AdminToolbarSpacer } from "@/components/admin/AdminToolbar";
import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminRolesAPI, adminUsersAPI, authAPI } from "@/lib/api/endpoints";
import type { Event, Role, User } from "@sitcontix/types";
import { Users } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { createUsersColumns, type UserDisplay } from "./columns";

type UserRole = "admin" | "viewer" | "eventAdmin" | "custom";
type RoleFilter = UserRole | "all";
type StatusFilter = "active" | "inactive" | "all";

type UsersUiState = {
	users: User[];
	searchTerm: string;
	roleFilter: RoleFilter;
	statusFilter: StatusFilter;
	events: Event[];
	roles: Role[];
	currentUserId: string | null;
	isLoading: boolean;
	isSaving: boolean;
	showEditModal: boolean;
	editingUser: User | null;
	selectedEventIds: string[];
	selectedRole: UserRole;
	selectedRoleId: string;
	selectedActive: boolean;
};

type UsersUiAction =
	| { type: "loadStarted" }
	| { type: "loadFinished" }
	| { type: "usersLoaded"; users: User[] }
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "rolesLoaded"; roles: Role[] }
	| { type: "currentUserLoaded"; id: string }
	| { type: "searchChanged"; value: string }
	| { type: "roleFilterChanged"; value: RoleFilter }
	| { type: "statusFilterChanged"; value: StatusFilter }
	| { type: "clearFilters" }
	| { type: "openEdit"; user: User }
	| { type: "closeEdit" }
	| { type: "saveStarted" }
	| { type: "saveFinished" }
	| { type: "roleChanged"; role: UserRole; roleId: string }
	| { type: "activeChanged"; active: boolean }
	| { type: "toggleEvent"; eventId: string };

function usersUiReducer(state: UsersUiState, action: UsersUiAction): UsersUiState {
	switch (action.type) {
		case "loadStarted":
			return { ...state, isLoading: true };
		case "loadFinished":
			return { ...state, isLoading: false };
		case "usersLoaded":
			return { ...state, users: action.users };
		case "eventsLoaded":
			return { ...state, events: action.events };
		case "rolesLoaded":
			return { ...state, roles: action.roles };
		case "currentUserLoaded":
			return { ...state, currentUserId: action.id };
		case "searchChanged":
			return { ...state, searchTerm: action.value };
		case "roleFilterChanged":
			return { ...state, roleFilter: action.value };
		case "statusFilterChanged":
			return { ...state, statusFilter: action.value };
		case "clearFilters":
			return { ...state, searchTerm: "", roleFilter: "all", statusFilter: "all" };
		case "openEdit":
			return {
				...state,
				showEditModal: true,
				editingUser: action.user,
				selectedRole: action.user.role,
				selectedRoleId: action.user.roleId ?? "",
				selectedActive: action.user.isActive,
				selectedEventIds: action.user.permissions || []
			};
		case "closeEdit":
			return { ...state, showEditModal: false, editingUser: null, selectedRole: "viewer", selectedRoleId: "", selectedActive: true, selectedEventIds: [] };
		case "saveStarted":
			return { ...state, isSaving: true };
		case "saveFinished":
			return { ...state, isSaving: false };
		case "roleChanged":
			return { ...state, selectedRole: action.role, selectedRoleId: action.roleId };
		case "activeChanged":
			return { ...state, selectedActive: action.active };
		case "toggleEvent":
			return {
				...state,
				selectedEventIds: state.selectedEventIds.includes(action.eventId) ? state.selectedEventIds.filter(id => id !== action.eventId) : [...state.selectedEventIds, action.eventId]
			};
		default:
			return state;
	}
}

const roleTones: Record<UserRole, StatusTone> = { admin: "info", eventAdmin: "warning", custom: "warning", viewer: "neutral" };

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

export default function UsersPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();
	const confirm = useConfirm();

	const [
		{ users, searchTerm, roleFilter, statusFilter, events, roles, currentUserId, isLoading, isSaving, showEditModal, editingUser, selectedEventIds, selectedRole, selectedRoleId, selectedActive },
		dispatchUsersUi
	] = useReducer(usersUiReducer, {
		users: [],
		searchTerm: "",
		roleFilter: "all",
		statusFilter: "all",
		events: [],
		roles: [],
		currentUserId: null,
		isLoading: true,
		isSaving: false,
		showEditModal: false,
		editingUser: null,
		selectedEventIds: [],
		selectedRole: "viewer",
		selectedRoleId: "",
		selectedActive: true
	});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "使用者管理", "zh-Hans": "用户管理", en: "User Management" },
		description: { "zh-Hant": "管理使用者的角色、狀態與可管理的活動。", "zh-Hans": "管理用户的角色、状态与可管理的活动。", en: "Manage user roles, status and which events they can manage." },
		search: { "zh-Hant": "搜尋名稱 / 電子郵件 / 電話", "zh-Hans": "搜索名称 / 电子邮件 / 电话", en: "Search name / email / phone" },
		clearSearch: { "zh-Hant": "清除搜尋", "zh-Hans": "清除搜索", en: "Clear search" },
		name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
		email: { "zh-Hant": "電子郵件", "zh-Hans": "电子邮件", en: "Email" },
		phone: { "zh-Hant": "電話號碼", "zh-Hans": "电话号码", en: "Phone Number" },
		role: { "zh-Hant": "角色", "zh-Hans": "角色", en: "Role" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		active: { "zh-Hant": "啟用", "zh-Hans": "启用", en: "Active" },
		inactive: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Inactive" },
		allRoles: { "zh-Hant": "所有角色", "zh-Hans": "所有角色", en: "All roles" },
		allStatuses: { "zh-Hant": "所有狀態", "zh-Hans": "所有状态", en: "All statuses" },
		clearFilters: { "zh-Hant": "清除篩選", "zh-Hans": "清除筛选", en: "Clear filters" },
		admin: { "zh-Hant": "管理員", "zh-Hans": "管理员", en: "Admin" },
		viewer: { "zh-Hant": "檢視者", "zh-Hans": "查看者", en: "Viewer" },
		eventAdmin: { "zh-Hant": "活動管理員", "zh-Hans": "活动管理员", en: "Event Admin" },
		customRole: { "zh-Hant": "自訂角色", "zh-Hans": "自定义角色", en: "Custom role" },
		customRoles: { "zh-Hant": "自訂角色", "zh-Hans": "自定义角色", en: "Custom roles" },
		builtinRoles: { "zh-Hant": "內建角色", "zh-Hans": "内置角色", en: "Built-in roles" },
		customRoleHelp: {
			"zh-Hant": "此使用者擁有「{name}」角色的 {n} 項權限。可在「角色管理」調整內容。",
			"zh-Hans": "此用户拥有「{name}」角色的 {n} 项权限。可在「角色管理」调整内容。",
			en: 'This user gets the {n} permissions of the "{name}" role. Edit it under Roles.'
		},
		pickRole: { "zh-Hant": "請選擇角色", "zh-Hans": "请选择角色", en: "Select a role" },
		loadRolesFailed: { "zh-Hant": "無法載入角色列表", "zh-Hans": "无法载入角色列表", en: "Failed to load roles" },
		adminHelp: {
			"zh-Hant": "管理員可以管理所有內容，包括所有活動與使用者。",
			"zh-Hans": "管理员可以管理所有内容，包括所有活动与用户。",
			en: "Admins can manage everything, including all events and users."
		},
		eventAdminHelp: { "zh-Hant": "活動管理員只能管理下方勾選的活動。", "zh-Hans": "活动管理员只能管理下方勾选的活动。", en: "Event admins can only manage the events selected below." },
		viewerHelp: { "zh-Hant": "檢視者只能查看資料，無法進行任何修改。", "zh-Hans": "查看者只能查看数据，无法进行任何修改。", en: "Viewers have read-only access and cannot change anything." },
		editUser: { "zh-Hant": "編輯使用者", "zh-Hans": "编辑用户", en: "Edit User" },
		editUserDescription: { "zh-Hant": "調整此使用者的角色、狀態與活動權限。", "zh-Hans": "调整此用户的角色、状态与活动权限。", en: "Change this user's role, status and event access." },
		updateSuccess: { "zh-Hant": "成功更新使用者！", "zh-Hans": "成功更新用户！", en: "Successfully updated user!" },
		updateFailed: { "zh-Hant": "更新失敗", "zh-Hans": "更新失败", en: "Update failed" },
		loadUsersFailed: { "zh-Hant": "無法載入使用者列表", "zh-Hans": "无法载入用户列表", en: "Failed to load users" },
		loadEventsFailed: { "zh-Hant": "無法載入活動列表", "zh-Hans": "无法载入活动列表", en: "Failed to load events" },
		emailVerified: { "zh-Hant": "已驗證", "zh-Hans": "已验证", en: "Verified" },
		emailNotVerified: { "zh-Hant": "未驗證", "zh-Hans": "未验证", en: "Not Verified" },
		manageableEvents: { "zh-Hant": "可管理的活動", "zh-Hans": "可管理的活动", en: "Manageable Events" },
		selectedEvents: { "zh-Hant": "已選擇 {n} 個活動", "zh-Hans": "已选择 {n} 个活动", en: "{n} selected" },
		noEvents: { "zh-Hant": "目前沒有任何活動", "zh-Hans": "目前没有任何活动", en: "There are no events yet" },
		noEventsAssigned: {
			"zh-Hant": "尚未選擇任何活動，此使用者將無法管理任何活動。",
			"zh-Hans": "尚未选择任何活动，此用户将无法管理任何活动。",
			en: "No events selected: this user won't be able to manage any event."
		},
		phoneNumbers: { "zh-Hant": "電話號碼", "zh-Hans": "电话号码", en: "Phone numbers" },
		selfEditNotice: {
			"zh-Hant": "這是你自己的帳號：為避免把自己鎖在外面，無法變更自己的角色與狀態。",
			"zh-Hans": "这是你自己的账号：为避免把自己锁在外面，无法变更自己的角色与状态。",
			en: "This is your own account: your role and status can't be changed here so you don't lock yourself out."
		},
		confirmDeactivateTitle: { "zh-Hant": "停用此使用者？", "zh-Hans": "停用此用户？", en: "Deactivate this user?" },
		confirmDeactivateDescription: {
			"zh-Hant": "停用後，此使用者將無法登入與使用後台。",
			"zh-Hans": "停用后，此用户将无法登录与使用后台。",
			en: "They will no longer be able to sign in or use the admin area."
		},
		confirmDemoteTitle: { "zh-Hant": "降低此管理員的權限？", "zh-Hans": "降低此管理员的权限？", en: "Remove admin access?" },
		confirmDemoteDescription: { "zh-Hant": "此使用者將不再擁有所有內容的管理權限。", "zh-Hans": "此用户将不再拥有所有内容的管理权限。", en: "This user will no longer be able to manage everything." },
		confirmAction: { "zh-Hant": "確認變更", "zh-Hans": "确认变更", en: "Apply change" },
		noUsers: { "zh-Hant": "還沒有任何使用者", "zh-Hans": "还没有任何用户", en: "No users yet" },
		noResults: { "zh-Hant": "找不到符合條件的使用者", "zh-Hans": "找不到符合条件的用户", en: "No users match your filters" },
		noResultsHint: { "zh-Hant": "試試其他關鍵字，或清除篩選條件。", "zh-Hans": "试试其他关键字，或清除筛选条件。", en: "Try a different keyword or clear the filters." }
	});

	const roleLabels = useMemo<Record<UserRole, string>>(() => ({ admin: t.admin, eventAdmin: t.eventAdmin, viewer: t.viewer, custom: t.customRole }), [t.admin, t.eventAdmin, t.viewer, t.customRole]);

	const selectedCustomRole = selectedRole === "custom" ? roles.find(role => role.id === selectedRoleId) : undefined;
	const roleHelp =
		selectedRole === "custom"
			? selectedCustomRole
				? t.customRoleHelp.replace("{name}", selectedCustomRole.name).replace("{n}", String(selectedCustomRole.permissions.length))
				: t.pickRole
			: { admin: t.adminHelp, eventAdmin: t.eventAdminHelp, viewer: t.viewerHelp }[selectedRole];
	// Roles that are not scoped to every event only apply to the events picked below
	const needsEventSelection = selectedRole === "eventAdmin" || (selectedRole === "custom" && !!selectedCustomRole && !selectedCustomRole.allEvents);

	const loadUsers = useCallback(async () => {
		dispatchUsersUi({ type: "loadStarted" });
		try {
			const response = await adminUsersAPI.getAll();
			if (response.success && response.data) {
				dispatchUsersUi({ type: "usersLoaded", users: response.data });
			} else {
				showAlert(`${t.loadUsersFailed}${response.message ? `: ${response.message}` : ""}`, "error");
			}
		} catch (error) {
			console.error("Failed to load users:", error);
			showAlert(`${t.loadUsersFailed}: ${getErrorMessage(error)}`, "error");
		} finally {
			dispatchUsersUi({ type: "loadFinished" });
		}
	}, [showAlert, t.loadUsersFailed]);

	useEffect(() => {
		void loadUsers();
	}, [loadUsers]);

	useEffect(() => {
		let cancelled = false;

		adminEventsAPI
			.getAll()
			.then(response => {
				if (cancelled) return;
				if (response.success && response.data) dispatchUsersUi({ type: "eventsLoaded", events: response.data });
				else showAlert(t.loadEventsFailed, "error");
			})
			.catch(error => {
				console.error("Failed to load events:", error);
				if (!cancelled) showAlert(`${t.loadEventsFailed}: ${getErrorMessage(error)}`, "error");
			});

		return () => {
			cancelled = true;
		};
	}, [showAlert, t.loadEventsFailed]);

	useEffect(() => {
		let cancelled = false;

		adminRolesAPI
			.getAll()
			.then(response => {
				if (cancelled) return;
				if (response.success && response.data) dispatchUsersUi({ type: "rolesLoaded", roles: response.data });
			})
			.catch(error => {
				console.error("Failed to load roles:", error);
				if (!cancelled) showAlert(`${t.loadRolesFailed}: ${getErrorMessage(error)}`, "error");
			});

		return () => {
			cancelled = true;
		};
	}, [showAlert, t.loadRolesFailed]);

	useEffect(() => {
		let cancelled = false;

		// Only used to stop admins from demoting or deactivating themselves; without it the guard is simply skipped.
		authAPI
			.getSession()
			.then(session => {
				if (!cancelled && session?.user?.id) dispatchUsersUi({ type: "currentUserLoaded", id: session.user.id });
			})
			.catch(error => console.error("Failed to load current session:", error));

		return () => {
			cancelled = true;
		};
	}, []);

	const openEditModal = useCallback((user: User) => dispatchUsersUi({ type: "openEdit", user }), []);
	const closeEditModal = useCallback(() => dispatchUsersUi({ type: "closeEdit" }), []);

	const isEditingSelf = !!editingUser && editingUser.id === currentUserId;

	async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!editingUser || isSaving) return;

		if (!isEditingSelf) {
			if (editingUser.isActive && !selectedActive) {
				if (!(await confirm({ title: t.confirmDeactivateTitle, description: t.confirmDeactivateDescription, destructive: true, confirmLabel: t.confirmAction }))) return;
			} else if (editingUser.role === "admin" && selectedRole !== "admin") {
				if (!(await confirm({ title: t.confirmDemoteTitle, description: t.confirmDemoteDescription, destructive: true, confirmLabel: t.confirmAction }))) return;
			}
		}

		if (selectedRole === "custom" && !selectedCustomRole) {
			showAlert(t.pickRole, "error");
			return;
		}

		dispatchUsersUi({ type: "saveStarted" });
		try {
			const response = await adminUsersAPI.update(editingUser.id, {
				role: selectedRole,
				roleId: selectedRole === "custom" ? selectedRoleId : null,
				isActive: selectedActive,
				permissions: needsEventSelection ? selectedEventIds : []
			});
			if (!response.success) {
				showAlert(`${t.updateFailed}${response.message ? `: ${response.message}` : ""}`, "error");
				return;
			}
			closeEditModal();
			showAlert(t.updateSuccess, "success");
			await loadUsers();
		} catch (error) {
			showAlert(`${t.updateFailed}: ${getErrorMessage(error)}`, "error");
		} finally {
			dispatchUsersUi({ type: "saveFinished" });
		}
	}

	const filteredUsers = useMemo(() => {
		const q = searchTerm.trim().toLowerCase();
		const qDigits = q.replace(/[\s()-]/g, "");
		return users.filter(user => {
			if (roleFilter !== "all" && user.role !== roleFilter) return false;
			if (statusFilter !== "all" && user.isActive !== (statusFilter === "active")) return false;
			if (!q) return true;
			const phones = [user.phoneNumber, ...(user.smsVerifications?.map(sms => sms.phoneNumber) ?? [])].filter((phone): phone is string => !!phone);
			return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || (qDigits.length > 0 && phones.some(phone => phone.replace(/[\s()-]/g, "").includes(qDigits)));
		});
	}, [users, searchTerm, roleFilter, statusFilter]);

	const displayUsers = useMemo((): UserDisplay[] => {
		const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
		return filteredUsers.map(user => {
			return {
				...user,
				roleLabel: user.role === "custom" ? (user.customRole?.name ?? roleLabels.custom) : (roleLabels[user.role] ?? user.role),
				roleTone: roleTones[user.role] ?? "neutral",
				statusLabel: user.isActive ? t.active : t.inactive,
				statusTone: user.isActive ? "success" : "neutral",
				phoneDisplay: user.phoneNumber || "",
				phoneIsVerified: !!user.phoneNumber && user.phoneVerified,
				createdAtTimestamp: new Date(user.createdAt).getTime(),
				formattedCreatedAt: dateFormatter.format(new Date(user.createdAt))
			};
		});
	}, [filteredUsers, locale, roleLabels, t.active, t.inactive]);

	const columns = useMemo(
		() =>
			createUsersColumns({
				onEdit: openEditModal,
				t: {
					name: t.name,
					email: t.email,
					phone: t.phone,
					role: t.role,
					status: t.status,
					createdAt: t.createdAt,
					edit: t.edit,
					emailVerified: t.emailVerified,
					emailNotVerified: t.emailNotVerified
				}
			}),
		[openEditModal, t.name, t.email, t.phone, t.role, t.status, t.createdAt, t.edit, t.emailVerified, t.emailNotVerified]
	);

	// Historical SMS success does not establish current ownership of a number.
	const editingPhones = useMemo(() => {
		if (!editingUser) return [];
		const phones = new Map<string, boolean>();
		if (editingUser.phoneNumber) phones.set(editingUser.phoneNumber, editingUser.phoneVerified);
		for (const sms of editingUser.smsVerifications ?? []) {
			if (!phones.has(sms.phoneNumber)) phones.set(sms.phoneNumber, false);
		}
		return [...phones.entries()].map(([phoneNumber, verified]) => ({ phoneNumber, verified }));
	}, [editingUser]);

	const hasFilters = searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all";

	return (
		<main>
			<AdminHeader title={t.title} description={t.description} />

			<AdminToolbar>
				<SearchInput value={searchTerm} onChange={value => dispatchUsersUi({ type: "searchChanged", value })} placeholder={t.search} clearLabel={t.clearSearch} />
				<Select value={roleFilter} onValueChange={value => dispatchUsersUi({ type: "roleFilterChanged", value: value as RoleFilter })}>
					<SelectTrigger aria-label={t.role} className="h-10 w-full sm:w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t.allRoles}</SelectItem>
						<SelectItem value="admin">{t.admin}</SelectItem>
						<SelectItem value="eventAdmin">{t.eventAdmin}</SelectItem>
						<SelectItem value="custom">{t.customRole}</SelectItem>
						<SelectItem value="viewer">{t.viewer}</SelectItem>
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={value => dispatchUsersUi({ type: "statusFilterChanged", value: value as StatusFilter })}>
					<SelectTrigger aria-label={t.status} className="h-10 w-full sm:w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t.allStatuses}</SelectItem>
						<SelectItem value="active">{t.active}</SelectItem>
						<SelectItem value="inactive">{t.inactive}</SelectItem>
					</SelectContent>
				</Select>
				{hasFilters && (
					<Button type="button" variant="ghost" size="sm" onClick={() => dispatchUsersUi({ type: "clearFilters" })}>
						{t.clearFilters}
					</Button>
				)}
				<AdminToolbarSpacer />
			</AdminToolbar>

			<DataTable
				columns={columns}
				data={displayUsers}
				isLoading={isLoading}
				getRowId={user => user.id}
				onRowClick={openEditModal}
				emptyState={
					<EmptyState
						icon={Users}
						title={hasFilters ? t.noResults : t.noUsers}
						description={hasFilters ? t.noResultsHint : undefined}
						action={
							hasFilters ? (
								<Button type="button" variant="secondary" size="sm" onClick={() => dispatchUsersUi({ type: "clearFilters" })}>
									{t.clearFilters}
								</Button>
							) : undefined
						}
						className="border-0"
					/>
				}
			/>

			<Dialog open={showEditModal} onOpenChange={open => !open && closeEditModal()}>
				<DialogContent className="max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t.editUser}</DialogTitle>
						<DialogDescription>{t.editUserDescription}</DialogDescription>
					</DialogHeader>
					{editingUser && (
						<form onSubmit={handleUpdateUser} className="space-y-5">
							<dl className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
								<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
									<dt className="text-muted-foreground">{t.name}</dt>
									<dd className="font-medium">{editingUser.name}</dd>
								</div>
								<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
									<dt className="text-muted-foreground">{t.email}</dt>
									<dd className="flex flex-wrap items-center gap-2 font-medium">
										{editingUser.email}
										<StatusBadge tone={editingUser.emailVerified ? "success" : "neutral"}>{editingUser.emailVerified ? t.emailVerified : t.emailNotVerified}</StatusBadge>
									</dd>
								</div>
								{editingPhones.length > 0 && (
									<div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
										<dt className="text-muted-foreground">{t.phoneNumbers}</dt>
										<dd>
											<ul className="space-y-1">
												{editingPhones.map(phone => (
													<li key={phone.phoneNumber} className="flex flex-wrap items-center justify-end gap-2 font-medium">
														<span className="tabular-nums">{phone.phoneNumber}</span>
														<StatusBadge tone={phone.verified ? "success" : "neutral"}>{phone.verified ? t.emailVerified : t.emailNotVerified}</StatusBadge>
													</li>
												))}
											</ul>
										</dd>
									</div>
								)}
							</dl>

							{isEditingSelf && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">{t.selfEditNotice}</p>}

							<div className="space-y-2">
								<Label htmlFor="user-role">{t.role}</Label>
								<Select
									value={selectedRole === "custom" ? `custom:${selectedRoleId}` : selectedRole}
									onValueChange={value =>
										value.startsWith("custom:")
											? dispatchUsersUi({ type: "roleChanged", role: "custom", roleId: value.slice("custom:".length) })
											: dispatchUsersUi({ type: "roleChanged", role: value as UserRole, roleId: "" })
									}
									disabled={isEditingSelf}
								>
									<SelectTrigger id="user-role" className="w-full">
										<SelectValue placeholder={t.pickRole} />
									</SelectTrigger>
									<SelectContent>
										<SelectGroup>
											<SelectLabel>{t.builtinRoles}</SelectLabel>
											<SelectItem value="admin">{t.admin}</SelectItem>
											<SelectItem value="eventAdmin">{t.eventAdmin}</SelectItem>
											<SelectItem value="viewer">{t.viewer}</SelectItem>
										</SelectGroup>
										{roles.length > 0 && (
											<SelectGroup>
												<SelectLabel>{t.customRoles}</SelectLabel>
												{roles.map(role => (
													<SelectItem key={role.id} value={`custom:${role.id}`}>
														{role.name}
													</SelectItem>
												))}
											</SelectGroup>
										)}
									</SelectContent>
								</Select>
								<p className="text-sm text-muted-foreground">{roleHelp}</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="user-status">{t.status}</Label>
								<Select value={selectedActive ? "true" : "false"} onValueChange={value => dispatchUsersUi({ type: "activeChanged", active: value === "true" })} disabled={isEditingSelf}>
									<SelectTrigger id="user-status" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="true">{t.active}</SelectItem>
										<SelectItem value="false">{t.inactive}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{needsEventSelection && (
								<fieldset className="space-y-2">
									<legend className="mb-2 flex w-full items-center justify-between gap-2 text-md font-bold">
										{t.manageableEvents}
										<span className="text-xs font-normal text-muted-foreground">{t.selectedEvents.replace("{n}", String(selectedEventIds.length))}</span>
									</legend>
									<div className="max-h-52 overflow-y-auto rounded-lg border">
										{events.length === 0 ? (
											<p className="p-3 text-sm text-muted-foreground">{t.noEvents}</p>
										) : (
											events.map(event => (
												<Label key={event.id} htmlFor={`event-${event.id}`} className="flex cursor-pointer items-center gap-3 border-b p-3 font-normal last:border-b-0 hover:bg-muted/50">
													<Checkbox id={`event-${event.id}`} checked={selectedEventIds.includes(event.id)} onCheckedChange={() => dispatchUsersUi({ type: "toggleEvent", eventId: event.id })} />
													<span className="leading-snug">{event.name[locale] || event.name.en || Object.values(event.name)[0]}</span>
												</Label>
											))
										)}
									</div>
									{selectedEventIds.length === 0 && <p className="text-sm text-amber-700 dark:text-amber-400">{t.noEventsAssigned}</p>}
								</fieldset>
							)}

							<DialogFooter>
								<Button type="button" variant="secondary" onClick={closeEditModal}>
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
