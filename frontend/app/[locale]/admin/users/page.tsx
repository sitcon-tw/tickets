"use client";

import AdminNav from "@/components/AdminNav";
import PageSpinner from "@/components/PageSpinner";
import { useAlert } from "@/contexts/AlertContext";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI, adminUsersAPI } from "@/lib/api/endpoints";
import type { Event, User } from "@/lib/types/api";
import { useLocale } from "next-intl";
import React, { useCallback, useEffect, useState } from "react";

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

	return (
		<>
			<AdminNav />
			<main>
				<h1 className="text-3xl font-bold">{t.title}</h1>
				<div className="h-8" />
				<section className="admin-controls">
					<input type="text" placeholder={"🔍 " + t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="admin-input" />
				</section>

				<section>
					<div className="admin-table-container">
						{isLoading && (
							<div className="admin-loading">
								<PageSpinner size={48} />
							</div>
						)}
						{!isLoading && (
							<table className="admin-table">
								<thead>
									<tr>
										<th>{t.name}</th>
										<th>{t.email}</th>
										<th>{t.role}</th>
										<th>{t.status}</th>
										<th>{t.createdAt}</th>
										<th>{t.actions}</th>
									</tr>
								</thead>
								<tbody>
									{filteredUsers.map(user => {
										const roleClass = user.role === "admin" ? "primary" : user.role === "eventAdmin" ? "warning" : "secondary";

										return (
											<tr key={user.id}>
												<td>{user.name}</td>
												<td>
													{user.email}
													{user.emailVerified && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", opacity: 0.7 }}>✓ {t.emailVerified}</span>}
												</td>
												<td>
													<span className={`status-badge ${roleClass}`}>{getRoleLabel(user.role)}</span>
												</td>
												<td>
													<span className={`status-badge ${user.isActive ? "active" : "ended"}`}>{user.isActive ? t.active : t.inactive}</span>
												</td>
												<td>{new Date(user.createdAt).toLocaleString()}</td>
												<td>
													<button className="admin-button small secondary" onClick={() => openEditModal(user)}>
														{t.edit}
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</section>

				{showEditModal && editingUser && (
					<div className="admin-modal-overlay" onClick={closeEditModal}>
						<div className="admin-modal" onClick={e => e.stopPropagation()}>
							<div className="admin-modal-header">
								<h2 className="admin-modal-title">{t.editUser}</h2>
								<button className="admin-modal-close" onClick={closeEditModal}>
									✕
								</button>
							</div>
							<form onSubmit={handleUpdateUser}>
								<div style={{ marginBottom: "1.5rem" }}>
									<p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
										{t.name}: <strong>{editingUser.name}</strong>
									</p>
									<p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
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
								<div className="admin-form-group" style={{ marginTop: "1rem" }}>
									<label className="admin-form-label">{t.status}</label>
									<select name="isActive" defaultValue={editingUser.isActive ? "true" : "false"} className="admin-select">
										<option value="true">{t.active}</option>
										<option value="false">{t.inactive}</option>
									</select>
								</div>
								{/* Event selection for eventAdmin role */}
								{selectedRole === "eventAdmin" && (
									<div className="admin-form-group" style={{ marginTop: "1rem" }}>
										<label className="admin-form-label">{t.manageableEvents}</label>
										<div
											style={{
												maxHeight: "200px",
												overflowY: "auto",
												border: "1px solid #ddd",
												borderRadius: "4px",
												padding: "0.5rem"
											}}
										>
											{events.length === 0 ? (
												<p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.7 }}>{t.noEventsSelected}</p>
											) : (
												events.map(event => (
													<label
														key={event.id}
														style={{
															display: "flex",
															alignItems: "center",
															padding: "0.5rem",
															cursor: "pointer",
															borderBottom: "1px solid #eee"
														}}
													>
														<input type="checkbox" checked={selectedEventIds.includes(event.id)} onChange={() => toggleEventSelection(event.id)} style={{ marginRight: "0.5rem" }} />
														<span>{event.name[locale] || event.name.en || Object.values(event.name)[0]}</span>
													</label>
												))
											)}
										</div>
										<p style={{ fontSize: "0.75rem", marginTop: "0.5rem", opacity: 0.7 }}>
											{selectedEventIds.length} {t.selectEvents}
										</p>
									</div>
								)}
								<div className="admin-modal-actions">
									<button type="submit" className="admin-button success">
										{t.save}
									</button>
									<button type="button" className="admin-button secondary" onClick={closeEditModal}>
										{t.cancel}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</>
	);
}
