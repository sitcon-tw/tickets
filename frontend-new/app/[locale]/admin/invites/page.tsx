"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { InvitationCodeInfo, Ticket } from "@/lib/types/api";

type InviteCode = {
  id: string;
  code: string;
  usedCount: number;
  usageLimit: number;
  usedBy?: string;
  active: boolean;
};

type InviteType = {
  id: string;
  name: string;
  createdAt: string;
  codes: InviteCode[];
};

export default function InvitesPage() {
  const locale = useLocale();

  const [inviteTypes, setInviteTypes] = useState<InviteType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<InviteType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [viewingCodesOf, setViewingCodesOf] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const t = getTranslations(locale, {
    title: { "zh-Hant": "邀請碼", "zh-Hans": "邀请码", en: "Invitation Codes" },
    add: { "zh-Hant": "新增邀請碼組", "zh-Hans": "新增邀请码组", en: "Add Invitation Code Group" },
    exportCSV: { "zh-Hant": "匯出 CSV", "zh-Hans": "导出 CSV", en: "Export CSV" },
    search: { "zh-Hant": "搜尋名稱 / 代碼", "zh-Hans": "搜索名称 / 代码", en: "Search Name / Code" },
    name: { "zh-Hant": "名稱", "zh-Hans": "名称", en: "Name" },
    total: { "zh-Hant": "總數", "zh-Hans": "总数", en: "Total" },
    used: { "zh-Hant": "已用", "zh-Hans": "已用", en: "Used" },
    remaining: { "zh-Hant": "剩餘", "zh-Hans": "剩余", en: "Remaining" },
    created: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created" },
    actions: { "zh-Hant": "動作", "zh-Hans": "动作", en: "Actions" },
    codes: { "zh-Hant": "邀請碼列表", "zh-Hans": "邀请码列表", en: "Invitation Codes" },
    code: { "zh-Hant": "代碼", "zh-Hans": "代码", en: "Code" },
    usage: { "zh-Hant": "使用次數", "zh-Hans": "使用次数", en: "Usage" },
    limit: { "zh-Hant": "使用上限", "zh-Hans": "使用上限", en: "Limit" },
    status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
    save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
    cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
    amount: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Amount" }
  });

  const loadInvitationCodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminInvitationCodesAPI.getAll();
      if (response.success) {
        const codesByType: Record<string, InviteType> = {};
        (response.data || []).forEach((code: InvitationCodeInfo) => {
          const typeName = code.name || 'Default';
          if (!codesByType[typeName]) {
            codesByType[typeName] = {
              id: typeName,
              name: typeName,
              createdAt: code.createdAt,
              codes: []
            };
          }
          codesByType[typeName].codes.push({
            id: code.id,
            code: code.code,
            usedCount: code.usedCount || 0,
            usageLimit: code.usageLimit || 1,
            usedBy: '',
            active: code.isActive !== false
          });
        });
        setInviteTypes(Object.values(codesByType));
        setFilteredTypes(Object.values(codesByType));
      }
    } catch (error) {
      console.error('Failed to load invitation codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    try {
      const response = await adminTicketsAPI.getAll();
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, []);

  useEffect(() => {
    loadInvitationCodes();
    loadTickets();
  }, [loadInvitationCodes, loadTickets]);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const filtered = inviteTypes.filter(t => {
      if (!q) return true;
      if (t.name.toLowerCase().includes(q)) return true;
      return t.codes.some(c => c.code.toLowerCase().includes(q));
    });
    setFilteredTypes(filtered);
  }, [inviteTypes, searchTerm]);

  const createInvitationCodes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ticketId = formData.get('ticketId') as string;

    if (!ticketId) {
      alert('請選擇票種');
      return;
    }

    const data = {
      ticketId,
      prefix: formData.get('name') as string,
      count: parseInt(formData.get('amount') as string),
      usageLimit: 1,
    };

    try {
      await adminInvitationCodesAPI.bulkCreate(data);
      await loadInvitationCodes();
      setShowModal(false);
    } catch (error: any) {
      alert('創建失敗: ' + error.message);
    }
  };

  const openCodesModal = (typeId: string) => {
    setViewingCodesOf(typeId);
    setShowCodesModal(true);
  };

  const currentType = inviteTypes.find(t => t.id === viewingCodesOf);

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
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#222",
              border: "1px solid #444",
              color: "#eee",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem"
            }}
          >
            ➕ {t.add}
          </button>
          <input
            type="text"
            placeholder={"🔍" + t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: "#222",
              border: "1px solid #444",
              color: "#eee",
              borderRadius: "6px",
              padding: "6px 12px",
              fontSize: "0.75rem"
            }}
          />
        </section>

        <section>
          {isLoading && <div>載入中...</div>}
          {!isLoading && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.8rem"
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.name}
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.total}
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.used}
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.remaining}
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.created}
                  </th>
                  <th
                    style={{
                      padding: "8px 10px",
                      textAlign: "left",
                      borderBottom: "1px solid #333",
                      background: "#161616",
                      fontWeight: "600"
                    }}
                  >
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map(type => {
                  const used = type.codes.filter(c => c.usedCount > 0).length;
                  const total = type.codes.length;
                  return (
                    <tr key={type.id}>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {type.name}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {total}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {used}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {total - used}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {new Date(type.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        <button onClick={() => openCodesModal(type.id)}>檢視</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {showModal && (
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
            onClick={() => setShowModal(false)}
          >
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
                maxWidth: "420px",
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
                <h2 style={{ fontSize: "1rem", margin: "0" }}>{t.add}</h2>
                <button
                  onClick={() => setShowModal(false)}
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
                onSubmit={createInvitationCodes}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem"
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    fontSize: "0.75rem"
                  }}
                >
                  票種
                  <select
                    name="ticketId"
                    required
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <option value="">請選擇票種</option>
                    {tickets.map(ticket => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.name}
                      </option>
                    ))}
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
                  {t.name}
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. VIP Media"
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem"
                    }}
                  />
                </label>
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    fontSize: "0.75rem"
                  }}
                >
                  {t.amount}
                  <input
                    name="amount"
                    type="number"
                    min="1"
                    max="1000"
                    defaultValue="10"
                    required
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem"
                    }}
                  />
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
                    onClick={() => setShowModal(false)}
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

        {showCodesModal && currentType && (
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
            onClick={() => setShowCodesModal(false)}
          >
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
                maxWidth: "900px",
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
                <h2 style={{ fontSize: "1rem", margin: "0" }}>
                  {t.codes} - {currentType.name}
                </h2>
                <button
                  onClick={() => setShowCodesModal(false)}
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
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8rem"
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        borderBottom: "1px solid #333",
                        background: "#161616",
                        fontWeight: "600"
                      }}
                    >
                      {t.code}
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        borderBottom: "1px solid #333",
                        background: "#161616",
                        fontWeight: "600"
                      }}
                    >
                      {t.usage}
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        borderBottom: "1px solid #333",
                        background: "#161616",
                        fontWeight: "600"
                      }}
                    >
                      {t.limit}
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        borderBottom: "1px solid #333",
                        background: "#161616",
                        fontWeight: "600"
                      }}
                    >
                      {t.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentType.codes.map(code => {
                    const status = !code.active ? "inactive" : code.usedCount >= code.usageLimit ? "usedup" : "active";
                    const statusColor = status === "active" ? "#4ade80" : status === "usedup" ? "#f87171" : "#eee";
                    return (
                      <tr key={code.id}>
                        <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                          {code.code}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                          {code.usedCount}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                          {code.usageLimit}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.65rem",
                              background: "#222",
                              border: "1px solid #333",
                              color: statusColor
                            }}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
