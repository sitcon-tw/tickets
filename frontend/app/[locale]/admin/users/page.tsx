"use client";

import AdminHeader from "@/components/AdminHeader";
import { DataTable } from "@/components/data-table/data-table";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminUsersAPI } from "@/lib/api/endpoints";
import type { Event, User } from "@sitcontix/types";
import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useReducer } from "react";
import { createUsersColumns, type UserDisplay } from "./columns";

type UserRole = "admin" | "viewer" | "eventAdmin";
type UsersUiState = {
	users: User[];
	searchTerm: string;
	events: Event[];
	isLoading: boolean;
	isSaving: boolean;
	showEditModal: boolean;
	editingUser: User | null;
	selectedEventIds: string[];
	selectedRole: UserRole;
};

type UsersUiAction =
	| { type: "loadStarted" }
	| { type: "loadFinished" }
	| { type: "usersLoaded"; users: User[] }
	| { type: "eventsLoaded"; events: Event[] }
	| { type: "searchChanged"; value: string }
	| { type: "openEdit"; user: User }
	| { type: "closeEdit" }
	| { type: "saveStarted" }
	| { type: "saveFinished" }
	| { type: "roleChanged"; role: UserRole }
	| { type: "toggleEvent"; eventId: string }
	| { type: "setEditOpen"; open: boolean };

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
		case "searchChanged":
			return { ...state, searchTerm: action.value };
		case "openEdit":
			return {
				...state,
				showEditModal: true,
				editingUser: action.user,
				selectedRole: action.user.role,
				selectedEventIds: action.user.permissions || []
			};
		case "closeEdit":
			return { ...state, showEditModal: false, editingUser: null, selectedRole: "viewer", selectedEventIds: [] };
		case "saveStarted":
			return { ...state, isSaving: true };
		case "saveFinished":
			return { ...state, isSaving: false };
		case "roleChanged":
			return {
				...state,
				selectedRole: action.role,
				selectedEventIds: action.role === "eventAdmin" ? state.selectedEventIds : []
			};
		case "toggleEvent":
			return {
				...state,
				selectedEventIds: state.selectedEventIds.includes(action.eventId) ? state.selectedEventIds.filter(id => id !== action.eventId) : [...state.selectedEventIds, action.eventId]
			};
		case "setEditOpen":
			return action.open ? { ...state, showEditModal: true } : usersUiReducer(state, { type: "closeEdit" });
		default:
			return state;
	}
}

export default function UsersPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [{ users, searchTerm, events, isLoading, isSaving, showEditModal, editingUser, selectedEventIds, selectedRole }, dispatchUsersUi] = useReducer(usersUiReducer, {
		users: [],
		searchTerm: "",
		events: [],
		isLoading: false,
		isSaving: false,
		showEditModal: false,
		editingUser: null,
		selectedEventIds: [],
		selectedRole: "viewer"
	});

	const t = getTranslations(locale, {
		title: { "zh-Hant": "使用者管理", "zh-Hans": "用户管理", en: "User Management" },
		search: { "zh-Hant": "搜尋名稱 / 電子郵件", "zh-Hans": "搜索名称 / 电子邮件", en: "Search Name / Email" },
		name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
		email: { "zh-Hant": "電子郵件", "zh-Hans": "电子邮件", en: "Email" },
		role: { "zh-Hant": "角色", "zh-Hans": "角色", en: "Role" },
		status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
		createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" },
		actions: { "zh-Hant": "動作", "zh-Hans": "动作", en: "Actions" },
		edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
		save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
		active: { "zh-Hant": "啟用", "zh-Hans": "启用", en: "Active" },
		inactive: { "zh-Hant": "停用", "zh-Hans": "停用", en: "Inactive" },
		admin: { "zh-Hant": "管理員", "zh-Hans": "管理员", en: "Admin" },
		viewer: { "zh-Hant": "檢視者", "zh-Hans": "查看者", en: "Viewer" },
		eventAdmin: { "zh-Hant": "活動管理員", "zh-Hans": "活动管理员", en: "Event Admin" },
		editUser: { "zh-Hant": "編輯使用者", "zh-Hans": "编辑用户", en: "Edit User" },
		updateSuccess: { "zh-Hant": "成功更新使用者！", "zh-Hans": "成功更新用户！", en: "Successfully updated user!" },
		updateFailed: { "zh-Hant": "更新失敗", "zh-Hans": "更新失败", en: "Update failed" },
		emailVerified: { "zh-Hant": "已驗證", "zh-Hans": "已验证", en: "Verified" },
		emailNotVerified: { "zh-Hant": "未驗證", "zh-Hans": "未验证", en: "Not Verified" },
		manageableEvents: { "zh-Hant": "可管理的活動", "zh-Hans": "可管理的活动", en: "Manageable Events" },
		selectEvents: { "zh-Hant": "選擇活動", "zh-Hans": "选择活动", en: "Select Events" },
		noEventsSelected: { "zh-Hant": "未選擇任何活動", "zh-Hans": "未选择任何活动", en: "No events selected" },
		phone: { "zh-Hant": "電話號碼", "zh-Hans": "电话号码", en: "Phone Number" }
	});

	const loadUsers = useCallback(async () => {
		dispatchUsersUi({ type: "loadStarted" });
		try {
			const response = await adminUsersAPI.getAll();
			if (response.success && response.data) {
				dispatchUsersUi({ type: "usersLoaded", users: response.data });
			}
		} catch (error) {
			console.error("Failed to load users:", error);
		} finally {
			dispatchUsersUi({ type: "loadFinished" });
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success && response.data) {
				dispatchUsersUi({ type: "eventsLoaded", events: response.data });
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	function openEditModal(user: User) {
		dispatchUsersUi({ type: "openEdit", user });
	}

	function closeEditModal() {
		dispatchUsersUi({ type: "closeEdit" });
	}

	async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!editingUser) return;
		dispatchUsersUi({ type: "saveStarted" });

		const formData = new FormData(e.currentTarget);
		const role = formData.get("role") as UserRole;
		const data = {
			role,
			isActive: formData.get("isActive") === "true",
			permissions: role === "eventAdmin" ? selectedEventIds : []
		};

		try {
			await adminUsersAPI.update(editingUser.id, data);
			await loadUsers();
			closeEditModal();
			showAlert(t.updateSuccess, "success");
		} catch (error) {
			showAlert(t.updateFailed + ": " + (error instanceof Error ? error.message : String(error)), "error");
		} finally {
			dispatchUsersUi({ type: "saveFinished" });
		}
	}

	function toggleEventSelection(eventId: string) {
		dispatchUsersUi({ type: "toggleEvent", eventId });
	}

	const getRoleLabel = useCallback(
		(role: string) => {
			switch (role) {
				case "admin":
					return t.admin;
				case "viewer":
					return t.viewer;
				case "eventAdmin":
					return t.eventAdmin;
				default:
					return role;
			}
		},
		[t.admin, t.eventAdmin, t.viewer]
	);

	useEffect(() => {
		loadUsers();
		loadEvents();
	}, [loadUsers, loadEvents]);

	const filteredUsers = useMemo(() => {
		const q = searchTerm.toLowerCase();
		return users.filter(user => {
			if (!q) return true;
			return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
		});
	}, [users, searchTerm]);

	const displayUsers = useMemo((): UserDisplay[] => {
		return filteredUsers.map(user => ({
			...user,
			roleLabel: getRoleLabel(user.role),
			roleClass: user.role === "admin" ? "primary" : user.role === "eventAdmin" ? "warning" : "secondary",
			statusLabel: user.isActive ? t.active : t.inactive,
			statusClass: user.isActive ? "active" : "ended",
			formattedCreatedAt: new Date(user.createdAt).toLocaleString()
		}));
	}, [filteredUsers, t.active, t.inactive, getRoleLabel]);

	const columns = useMemo(
		() =>
			createUsersColumns({
				onEdit: openEditModal,
				t: {
					edit: t.edit,
					active: t.active,
					inactive: t.inactive,
					emailVerified: t.emailVerified
				}
			}),
		[t.edit, t.active, t.inactive, t.emailVerified]
	);

	return (
		<main>
			<AdminHeader title={t.title} />
			<div className="relative w-fit mb-4">
				<Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
				<Input type="text" placeholder={t.search} value={searchTerm} onChange={e => dispatchUsersUi({ type: "searchChanged", value: e.target.value })} className="pl-10 h-11" />
			</div>

			<section>
				{isLoading ? (
					<div className="flex justify-center py-8">
						<PageSpinner />
					</div>
				) : (
					<DataTable columns={columns} data={displayUsers} />
				)}
			</section>

			<Dialog open={showEditModal} onOpenChange={open => dispatchUsersUi({ type: "setEditOpen", open })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t.editUser}</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleUpdateUser}>
						<div className="mb-6">
							<p className="m-0 mb-2 text-sm opacity-70">
								{t.name}: <strong>{editingUser?.name}</strong>
							</p>
							<p className="m-0 mb-2 text-sm opacity-70">
								{t.email}: <strong>{editingUser?.email}</strong>
							</p>
							<p className="m-0 text-sm opacity-70">
								{editingUser?.smsVerifications && editingUser.smsVerifications.length > 0
									? editingUser.smsVerifications.map(sms => (
											<span key={sms.id}>
												{t.phone}: {sms.phoneNumber} - {sms.verified ? t.emailVerified : t.emailNotVerified}
											</span>
										))
									: null}
							</p>
						</div>
						<div className="mb-4">
							<Label>{t.role}</Label>
							<Select
								name="role"
								value={selectedRole}
								onValueChange={value => {
									dispatchUsersUi({ type: "roleChanged", role: value as UserRole });
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="admin">{t.admin}</SelectItem>
									<SelectItem value="viewer">{t.viewer}</SelectItem>
									<SelectItem value="eventAdmin">{t.eventAdmin}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="mb-4">
							<Label>{t.status}</Label>
							<Select name="isActive" defaultValue={editingUser?.isActive ? "true" : "false"}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="true">{t.active}</SelectItem>
									<SelectItem value="false">{t.inactive}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{selectedRole === "eventAdmin" && (
							<div className="mb-4">
								<Label>{t.manageableEvents}</Label>
								<div className="max-h-[200px] overflow-y-auto border border-gray-300 dark:border-gray-700 rounded p-2">
									{events.length === 0 ? (
										<p className="m-0 text-sm opacity-70">{t.noEventsSelected}</p>
									) : (
										events.map(event => (
											<Label key={event.id} className="flex items-center p-2 cursor-pointer border-b border-gray-200 dark:border-gray-700">
												<Checkbox checked={selectedEventIds.includes(event.id)} onCheckedChange={() => toggleEventSelection(event.id)} className="mr-2" />
												<span>{event.name[locale] || event.name.en || Object.values(event.name)[0]}</span>
											</Label>
										))
									)}
								</div>
								<p className="text-xs mt-2 opacity-70">
									{selectedEventIds.length} {t.selectEvents}
								</p>
							</div>
						)}
						<DialogFooter>
							<Button type="submit" isLoading={isSaving}>
								{t.save}
							</Button>
							<Button type="button" variant="secondary" onClick={closeEditModal}>
								{t.cancel}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</main>
	);
}
