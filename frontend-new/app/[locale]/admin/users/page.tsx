"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminUsersAPI } from "@/lib/api/endpoints";
import type { User } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

export default function UsersPage() {
  const locale = useLocale();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
    editUser: { "zh-Hant": "編輯使用者", "zh-Hans": "编辑用户", en: "Edit User" },
    updateSuccess: { "zh-Hant": "成功更新使用者！", "zh-Hans": "成功更新用户！", en: "Successfully updated user!" },
    updateFailed: { "zh-Hant": "更新失敗", "zh-Hans": "更新失败", en: "Update failed" },
    emailVerified: { "zh-Hant": "已驗證", "zh-Hans": "已验证", en: "Verified" },
    emailNotVerified: { "zh-Hant": "未驗證", "zh-Hans": "未验证", en: "Not Verified" },
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
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const filtered = users.filter(user => {
      if (!q) return true;
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setShowEditModal(false);
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      role: formData.get('role') as 'admin' | 'viewer',
      isActive: formData.get('isActive') === 'true',
    };

    try {
      await adminUsersAPI.update(editingUser.id, data);
      await loadUsers();
      closeEditModal();
      alert(t.updateSuccess);
    } catch (error) {
      alert(t.updateFailed + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <>
      <AdminNav />
      <main>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="h-8" />
        <section className="admin-controls">
          <input
            type="text"
            placeholder={"🔍 " + t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input"
          />
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
                    const roleClass = user.role === 'admin' ? 'primary' : 'secondary';

                    return (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>
                          {user.email}
                          {user.emailVerified && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                              ✓ {t.emailVerified}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${roleClass}`}>
                            {user.role === 'admin' ? t.admin : t.viewer}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'ended'}`}>
                            {user.isActive ? t.active : t.inactive}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleString()}</td>
                        <td>
                          <button
                            className="admin-button small secondary"
                            onClick={() => openEditModal(user)}
                          >
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
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">{t.editUser}</h2>
                <button className="admin-modal-close" onClick={closeEditModal}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
                    {t.name}: <strong>{editingUser.name}</strong>
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", opacity: 0.7 }}>
                    {t.email}: <strong>{editingUser.email}</strong>
                  </p>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">{t.role}</label>
                  <select name="role" defaultValue={editingUser.role} className="admin-select">
                    <option value="admin">{t.admin}</option>
                    <option value="viewer">{t.viewer}</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ marginTop: '1rem' }}>
                  <label className="admin-form-label">{t.status}</label>
                  <select
                    name="isActive"
                    defaultValue={editingUser.isActive ? 'true' : 'false'}
                    className="admin-select"
                  >
                    <option value="true">{t.active}</option>
                    <option value="false">{t.inactive}</option>
                  </select>
                </div>
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
