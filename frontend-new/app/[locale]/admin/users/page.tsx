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
        <h1>{t.title}</h1>
        <section
          style={{
            display: "flex",
            gap: "0.5rem",
            margin: "1rem 0"
          }}
        >
          <input
            type="text"
            placeholder={"🔍 " + t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#111",
              border: "1px solid #333",
              color: "#eee",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "0.75rem"
            }}
          />
        </section>

        <section>
          <div style={{
            overflowX: 'auto',
            borderRadius: '8px',
            backgroundColor: 'var(--color-gray-800)',
            border: '2px solid var(--color-gray-900)'
          }}>
            {isLoading && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '3rem',
                opacity: 0.7
              }}>
                <PageSpinner size={48} />
                <p style={{ fontSize: '0.9rem' }}>Now Loading...</p>
              </div>
            )}
            {!isLoading && (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '900px'
              }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.name}
                    </th>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.email}
                    </th>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.role}
                    </th>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.status}
                    </th>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.createdAt}
                    </th>
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600
                    }}>
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const statusStyle: React.CSSProperties = {
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      display: 'inline-block',
                      backgroundColor: user.isActive ? '#d4edda' : '#f8d7da',
                      color: user.isActive ? '#155724' : '#721c24'
                    };

                    const roleStyle: React.CSSProperties = {
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      display: 'inline-block',
                      backgroundColor: user.role === 'admin' ? '#d1ecf1' : '#e2e3e5',
                      color: user.role === 'admin' ? '#0c5460' : '#383d41'
                    };

                    return (
                      <tr key={user.id}>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          {user.name}
                        </td>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          {user.email}
                          {user.emailVerified && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                              ✓ {t.emailVerified}
                            </span>
                          )}
                        </td>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          <span style={roleStyle}>
                            {user.role === 'admin' ? t.admin : t.viewer}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          <span style={statusStyle}>
                            {user.isActive ? t.active : t.inactive}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td style={{
                          padding: '0.5rem 1rem',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--color-gray-400)'
                        }}>
                          <button
                            className="button"
                            onClick={() => openEditModal(user)}
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem'
                            }}
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
          <div
            style={{
              position: "fixed",
              inset: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.6)",
              zIndex: "10"
            }}
            onClick={closeEditModal}
          >
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
                maxWidth: "560px",
                width: "100%"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <header
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem"
                }}
              >
                <h2 style={{ fontSize: "1rem", margin: "0" }}>{t.editUser}</h2>
                <button
                  onClick={closeEditModal}
                  style={{
                    background: "#2a2a2a",
                    border: "1px solid #444",
                    color: "#ccc",
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </header>
              <form
                onSubmit={handleUpdateUser}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem"
                }}
              >
                <div>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    {t.name}: <strong>{editingUser.name}</strong>
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", opacity: 0.7 }}>
                    {t.email}: <strong>{editingUser.email}</strong>
                  </p>
                </div>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    fontSize: "0.75rem"
                  }}
                >
                  {t.role}
                  <select
                    name="role"
                    defaultValue={editingUser.role}
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <option value="admin">{t.admin}</option>
                    <option value="viewer">{t.viewer}</option>
                  </select>
                </label>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    fontSize: "0.75rem"
                  }}
                >
                  {t.status}
                  <select
                    name="isActive"
                    defaultValue={editingUser.isActive ? 'true' : 'false'}
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <option value="true">{t.active}</option>
                    <option value="false">{t.inactive}</option>
                  </select>
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="submit"
                    style={{
                      background: "#155e29",
                      border: "1px solid #1d7b34",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "0.75rem",
                      cursor: "pointer"
                    }}
                  >
                    {t.save}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    style={{
                      background: "#222",
                      border: "1px solid #444",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      fontSize: "0.75rem",
                      cursor: "pointer"
                    }}
                  >
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
