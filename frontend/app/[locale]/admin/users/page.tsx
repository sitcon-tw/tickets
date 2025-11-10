"use client";

import AdminHeader from "@/components/AdminHeader";
import PageSpinner from "@/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminUsersAPI } from "@/lib/api/endpoints";
import type { Event, User } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { createUsersColumns, type UserDisplay } from "./columns";

export default function UsersPage() {
	const locale = useLocale();
	const { showAlert } = useAlert();

	const [users, setUsers] = useState<User[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
	const [selectedRole, setSelectedRole] = useState<"admin" | "viewer" | "eventAdmin">("viewer");

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
		noEventsSelected: { "zh-Hant": "未選擇任何活動", "zh-Hans": "未选择任何活动", en: "No events selected" }
	});

	const loadUsers = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await adminUsersAPI.getAll();
			if (response.success && response.data) {
				setUsers(response.data);
				setFilteredUsers(response.data);
			}
		} catch (error) {
			console.error("Failed to load users:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success && response.data) {
				setEvents(response.data);
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	function openEditModal(user: User) {
		setEditingUser(user);
		setSelectedRole(user.role);
		setSelectedEventIds(user.permissions || []);
		setShowEditModal(true);
	}

	function closeEditModal() {
		setEditingUser(null);
		setSelectedEventIds([]);
		setSelectedRole("viewer");
		setShowEditModal(false);
	}

	async function handleUpdateUser(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!editingUser) return;

		const formData = new FormData(e.currentTarget);
		const role = formData.get("role") as "admin" | "viewer" | "eventAdmin";
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
		}
	}

	function toggleEventSelection(eventId: string) {
		setSelectedEventIds(prev => {
			if (prev.includes(eventId)) {
				return prev.filter(id => id !== eventId);
			}
			return [...prev, eventId];
		});
	}

	function getRoleLabel(role: string) {
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
	}

	useEffect(() => {
		loadUsers();
		loadEvents();
	}, [loadUsers, loadEvents]);

	useEffect(() => {
		const q = searchTerm.toLowerCase();
		const filtered = users.filter(user => {
			if (!q) return true;
			return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
		});
		setFilteredUsers(filtered);
	}, [users, searchTerm]);

	const displayUsers = useMemo((): UserDisplay[] => {
		return filteredUsers.map(user => ({
			...user,
			roleLabel: getRoleLabel(user.role),
			roleClass: user.role === "admin" ? "primary" : user.role === "eventAdmin" ? "warning" : "secondary",
			statusLabel: user.isActive ? t.active : t.inactive,
			statusClass: user.isActive ? "active" : "ended",
			formattedCreatedAt: new Date(user.createdAt).toLocaleString(),
		}));
	}, [filteredUsers, t.active, t.inactive, t.admin, t.viewer, t.eventAdmin]);

	const columns = useMemo(
		() => createUsersColumns({
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
			<section className="admin-controls">
				<input type="text" placeholder={"🔍 " + t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" />
			</section>

			<section>
				{isLoading ? (
					<div className="admin-loading">
						<PageSpinner />
					</div>
				) : (
					<DataTable columns={columns} data={displayUsers} />
				)}
			</section>

			{showEditModal && editingUser && (
				<div className="admin-modal-overlay" onClick={closeEditModal}>
					<div className="admin-modal" onClick={e => e.stopPropagation()}>
						<div className="admin-modal-header">
							<h2 className="admin-modal-title">{t.editUser}</h2>
							<Button variant="ghost" size="icon" onClick={closeEditModal} className="h-8 w-8">
								✕
							</Button>
						</div>
						<form onSubmit={handleUpdateUser}>
							<div className="mb-6">
								<p className="m-0 mb-2 text-sm opacity-70">
									{t.name}: <strong>{editingUser.name}</strong>
								</p>
								<p className="m-0 mb-2 text-sm opacity-70">
									{t.email}: <strong>{editingUser.email}</strong>
								</p>
							</div>
							<div className="admin-form-group">
								<label className="admin-form-label">{t.role}</label>
								<select
									name="role"
									value={selectedRole}
									className="admin-select"
									onChange={e => {
										const newRole = e.target.value as "admin" | "viewer" | "eventAdmin";
										setSelectedRole(newRole);
										// Clear event selections when switching away from eventAdmin
										if (newRole !== "eventAdmin") {
											setSelectedEventIds([]);
										}
									}}
								>
									<option value="admin">{t.admin}</option>
									<option value="viewer">{t.viewer}</option>
									<option value="eventAdmin">{t.eventAdmin}</option>
								</select>
							</div>
							<div className="admin-form-group mt-4">
								<label className="admin-form-label">{t.status}</label>
								<select name="isActive" defaultValue={editingUser.isActive ? "true" : "false"} className="admin-select">
									<option value="true">{t.active}</option>
									<option value="false">{t.inactive}</option>
								</select>
							</div>
							{/* Event selection for eventAdmin role */}
							{selectedRole === "eventAdmin" && (
								<div className="admin-form-group mt-4">
									<label className="admin-form-label">{t.manageableEvents}</label>
									<div className="max-h-[200px] overflow-y-auto border border-gray-300 rounded p-2">
										{events.length === 0 ? (
											<p className="m-0 text-sm opacity-70">{t.noEventsSelected}</p>
										) : (
											events.map(event => (
												<label key={event.id} className="flex items-center p-2 cursor-pointer border-b border-gray-200">
													<input type="checkbox" checked={selectedEventIds.includes(event.id)} onChange={() => toggleEventSelection(event.id)} className="mr-2" />
													<span>{event.name[locale] || event.name.en || Object.values(event.name)[0]}</span>
												</label>
											))
										)}
									</div>
									<p className="text-xs mt-2 opacity-70">
										{selectedEventIds.length} {t.selectEvents}
									</p>
								</div>
							)}
							<div className="admin-modal-actions">
								<Button type="submit">
									{t.save}
								</Button>
								<Button type="button" variant="secondary" onClick={closeEditModal}>
									{t.cancel}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}
