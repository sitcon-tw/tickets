"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
import { invitationCodes as invitationCodesAPI, initializeAdminPage } from "@/lib/admin";

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
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const [inviteTypes, setInviteTypes] = useState<InviteType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<InviteType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [viewingCodesOf, setViewingCodesOf] = useState<string | null>(null);

  const t = i18n.t(lang, {
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
      const response = await invitationCodesAPI.list({ limit: 500 });
      if (response.success) {
        const codesByType: Record<string, InviteType> = {};
        (response.data || []).forEach((code: any) => {
          const typeName = code.type || 'Default';
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
            usedBy: code.usedBy,
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

  useEffect(() => {
    const init = async () => {
      const isAuthorized = await initializeAdminPage();
      if (!isAuthorized) return;
      await loadInvitationCodes();
    };
    init();
  }, [loadInvitationCodes]);

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
    const data = {
      type: formData.get('name') as string,
      count: parseInt(formData.get('amount') as string),
      usageLimit: 1,
      expiresAt: null
    };

    try {
      await invitationCodesAPI.bulkCreate(data);
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
        <section className="toolbar">
          <button onClick={() => setShowModal(true)}>➕ {t.add}</button>
          <input
            type="text"
            placeholder={"🔍" + t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        <section className="types-wrapper">
          {isLoading && <div className="loading">載入中...</div>}
          {!isLoading && (
            <table className="types-table">
              <thead>
                <tr>
                  <th>{t.name}</th>
                  <th>{t.total}</th>
                  <th>{t.used}</th>
                  <th>{t.remaining}</th>
                  <th>{t.created}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map(type => {
                  const used = type.codes.filter(c => c.usedCount > 0).length;
                  const total = type.codes.length;
                  return (
                    <tr key={type.id}>
                      <td>{type.name}</td>
                      <td>{total}</td>
                      <td>{used}</td>
                      <td>{total - used}</td>
                      <td>{new Date(type.createdAt).toLocaleString()}</td>
                      <td>
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
          <div className="modal" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <header className="modal-header">
                <h2>{t.add}</h2>
                <button onClick={() => setShowModal(false)}>✕</button>
              </header>
              <form onSubmit={createInvitationCodes}>
                <label>
                  {t.name}
                  <input name="name" type="text" required placeholder="e.g. VIP Media" />
                </label>
                <label>
                  {t.amount}
                  <input name="amount" type="number" min="1" max="1000" defaultValue="10" required />
                </label>
                <div className="actions-row">
                  <button type="submit" className="primary">{t.save}</button>
                  <button type="button" onClick={() => setShowModal(false)}>{t.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCodesModal && currentType && (
          <div className="modal" onClick={() => setShowCodesModal(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <header className="modal-header">
                <h2>{t.codes} - {currentType.name}</h2>
                <button onClick={() => setShowCodesModal(false)}>✕</button>
              </header>
              <table className="codes-table">
                <thead>
                  <tr>
                    <th>{t.code}</th>
                    <th>{t.usage}</th>
                    <th>{t.limit}</th>
                    <th>{t.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentType.codes.map(code => {
                    const status = !code.active ? "inactive" : code.usedCount >= code.usageLimit ? "usedup" : "active";
                    return (
                      <tr key={code.id}>
                        <td>{code.code}</td>
                        <td>{code.usedCount}</td>
                        <td>{code.usageLimit}</td>
                        <td>
                          <span className={`status-pill ${status}`}>{status}</span>
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

      <style jsx>{`
        .toolbar {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        .toolbar button,
        .toolbar input {
          background: #222;
          border: 1px solid #444;
          color: #eee;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.75rem;
        }
        .types-table,
        .codes-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }
        .types-table th,
        .types-table td,
        .codes-table th,
        .codes-table td {
          padding: 8px 10px;
          text-align: left;
          border-bottom: 1px solid #333;
        }
        .types-table th,
        .codes-table th {
          background: #161616;
          font-weight: 600;
        }
        .modal {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          z-index: 10;
        }
        .modal-content {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 10px;
          padding: 1rem 1.2rem;
          max-width: 420px;
          width: 100%;
        }
        .modal-content.large {
          max-width: 900px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .modal-header h2 {
          font-size: 1rem;
          margin: 0;
        }
        .modal-header button {
          background: #2a2a2a;
          border: 1px solid #444;
          color: #ccc;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        form label {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-size: 0.75rem;
        }
        form input {
          background: #111;
          border: 1px solid #333;
          color: #eee;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 0.8rem;
        }
        .actions-row {
          display: flex;
          gap: 0.5rem;
        }
        .actions-row button {
          background: #222;
          border: 1px solid #444;
          color: #eee;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .actions-row button.primary {
          background: #155e29;
          border-color: #1d7b34;
        }
        .status-pill {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          background: #222;
          border: 1px solid #333;
        }
        .status-pill.active {
          color: #4ade80;
        }
        .status-pill.usedup {
          color: #f87171;
        }
      `}</style>
    </>
  );
}
