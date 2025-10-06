"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminInvitationCodesAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { InvitationCodeInfo, Ticket } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

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
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

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
    amount: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Amount" },
    usageLimit: { "zh-Hant": "使用次數限制", "zh-Hans": "使用次数限制", en: "Usage Limit" },
    validFrom: { "zh-Hant": "有效起始時間", "zh-Hans": "有效起始时间", en: "Valid From" },
    validUntil: { "zh-Hant": "有效結束時間", "zh-Hans": "有效结束时间", en: "Valid Until" },
    optional: { "zh-Hant": "選填", "zh-Hans": "选填", en: "Optional" },
    ticketType: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Type" },
    pleaseSelectTicket: { "zh-Hant": "請選擇票種", "zh-Hans": "请选择票种", en: "Please Select Ticket" },
    createSuccess: { "zh-Hant": "成功建立 {count} 個邀請碼！", "zh-Hans": "成功建立 {count} 个邀请码！", en: "Successfully created {count} invitation codes!" },
    delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
    confirmDelete: { "zh-Hant": "確定要刪除此邀請碼嗎？", "zh-Hans": "确定要删除此邀请码吗？", en: "Are you sure you want to delete this invitation code?" },
    deleteSuccess: { "zh-Hant": "成功刪除邀請碼！", "zh-Hans": "成功删除邀请码！", en: "Successfully deleted invitation code!" },
    bulkDelete: { "zh-Hant": "批次刪除", "zh-Hans": "批次删除", en: "Bulk Delete" },
    confirmBulkDelete: { "zh-Hant": "確定要刪除 {count} 個邀請碼嗎？", "zh-Hans": "确定要删除 {count} 个邀请码吗？", en: "Are you sure you want to delete {count} invitation codes?" },
    bulkDeleteSuccess: { "zh-Hant": "成功刪除 {count} 個邀請碼！", "zh-Hans": "成功删除 {count} 个邀请码！", en: "Successfully deleted {count} invitation codes!" },
    selectAll: { "zh-Hant": "全選", "zh-Hans": "全选", en: "Select All" },
    deselectAll: { "zh-Hant": "取消全選", "zh-Hans": "取消全选", en: "Deselect All" },
    selected: { "zh-Hant": "已選 {count} 個", "zh-Hans": "已选 {count} 个", en: "{count} selected" }
  });

  // Load event ID from localStorage on mount
  useEffect(() => {
    const savedEventId = localStorage.getItem('selectedEventId');
    if (savedEventId) {
      setCurrentEventId(savedEventId);
    }
  }, []);

  // Listen for event changes from AdminNav
  useEffect(() => {
    const handleEventChange = (e: CustomEvent) => {
      setCurrentEventId(e.detail.eventId);
    };

    window.addEventListener('selectedEventChanged', handleEventChange as EventListener);
    return () => {
      window.removeEventListener('selectedEventChanged', handleEventChange as EventListener);
    };
  }, []);

  const loadInvitationCodes = useCallback(async () => {
    if (!currentEventId) return;

    setIsLoading(true);
    try {
      const response = await adminInvitationCodesAPI.getAll();
      if (response.success) {
        const codesByType: Record<string, InviteType> = {};
        // Filter codes by tickets that belong to the current event
        (response.data || []).forEach((code: InvitationCodeInfo) => {
          const ticket = tickets.find(t => t.id === code.ticketId);
          // Only include codes for tickets that belong to the current event
          if (ticket && ticket.eventId === currentEventId) {
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
          }
        });
        setInviteTypes(Object.values(codesByType));
        setFilteredTypes(Object.values(codesByType));
      }
    } catch (error) {
      console.error('Failed to load invitation codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId, tickets]);

  const loadTickets = useCallback(async () => {
    if (!currentEventId) return;

    try {
      const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, [currentEventId]);

  useEffect(() => {
    if (currentEventId) {
      loadTickets();
    }
  }, [currentEventId, loadTickets]);

  useEffect(() => {
    if (currentEventId && tickets.length > 0) {
      loadInvitationCodes();
    }
  }, [currentEventId, tickets, loadInvitationCodes]);

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
      alert(t.pleaseSelectTicket);
      return;
    }

    const count = parseInt(formData.get('amount') as string);
    const validFromStr = formData.get('validFrom') as string;
    const validUntilStr = formData.get('validUntil') as string;

    const data: {
      ticketId: string;
      prefix: string;
      count: number;
      usageLimit: number;
      validFrom?: string;
      validUntil?: string;
    } = {
      ticketId,
      prefix: formData.get('name') as string,
      count,
      usageLimit: parseInt(formData.get('usageLimit') as string) || 1,
    };

    if (validFromStr) {
      data.validFrom = new Date(validFromStr).toISOString();
    }
    if (validUntilStr) {
      data.validUntil = new Date(validUntilStr).toISOString();
    }

    try {
      await adminInvitationCodesAPI.bulkCreate(data);
      await loadTickets();
      await loadInvitationCodes();
      setShowModal(false);
      alert(t.createSuccess.replace('{count}', count.toString()));
    } catch (error) {
      alert('創建失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const deleteInvitationCode = async (codeId: string) => {
    if (!confirm(t.confirmDelete)) return;

    try {
      await adminInvitationCodesAPI.delete(codeId);
      await loadTickets();
      await loadInvitationCodes();
      alert(t.deleteSuccess);
    } catch (error) {
      alert('刪除失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const bulkDeleteInvitationCodes = async () => {
    if (selectedCodes.size === 0) {
      alert('請選擇要刪除的邀請碼');
      return;
    }

    if (!confirm(t.confirmBulkDelete.replace('{count}', selectedCodes.size.toString()))) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      // Delete codes one by one
      for (const codeId of selectedCodes) {
        try {
          await adminInvitationCodesAPI.delete(codeId);
          successCount++;
        } catch (error) {
          console.error(`Failed to delete code ${codeId}:`, error);
          errorCount++;
        }
      }

      // Reload data
      await loadTickets();
      await loadInvitationCodes();

      // Clear selection
      setSelectedCodes(new Set());

      // Show result
      if (errorCount > 0) {
        alert(`成功刪除 ${successCount} 個，失敗 ${errorCount} 個`);
      } else {
        alert(t.bulkDeleteSuccess.replace('{count}', successCount.toString()));
      }
    } catch (error) {
      alert('批次刪除失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const toggleCodeSelection = (codeId: string) => {
    const newSelection = new Set(selectedCodes);
    if (newSelection.has(codeId)) {
      newSelection.delete(codeId);
    } else {
      newSelection.add(codeId);
    }
    setSelectedCodes(newSelection);
  };

  const toggleSelectAll = () => {
    if (!currentType) return;

    const allCodeIds = currentType.codes.map(c => c.id);
    if (selectedCodes.size === allCodeIds.length) {
      // Deselect all
      setSelectedCodes(new Set());
    } else {
      // Select all
      setSelectedCodes(new Set(allCodeIds));
    }
  };

  const openCodesModal = (typeId: string) => {
    setViewingCodesOf(typeId);
    setSelectedCodes(new Set()); // Clear selection when opening modal
    setShowCodesModal(true);
  };

  const currentType = inviteTypes.find(t => t.id === viewingCodesOf);

  return (
    <>
      <AdminNav />
      <main>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="h-8" />
        <section className="admin-controls">
          <button onClick={() => setShowModal(true)} className="admin-button primary">
            ➕ {t.add}
          </button>
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
                          <button className="admin-button small secondary" onClick={() => openCodesModal(type.id)}>檢視</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">{t.add}</h2>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                  ✕
                </button>
              </div>
              <form onSubmit={createInvitationCodes}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t.ticketType}</label>
                    <select name="ticketId" required className="admin-select">
                      <option value="">{t.pleaseSelectTicket}</option>
                      {tickets.map(ticket => (
                        <option key={ticket.id} value={ticket.id}>
                          {ticket.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t.name}</label>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. VIP Media"
                      className="admin-input"
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.amount}</label>
                      <input
                        name="amount"
                        type="number"
                        min="1"
                        max="1000"
                        defaultValue="10"
                        required
                        className="admin-input"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.usageLimit}</label>
                      <input
                        name="usageLimit"
                        type="number"
                        min="1"
                        max="100"
                        defaultValue="1"
                        required
                        className="admin-input"
                      />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.validFrom} ({t.optional})</label>
                      <input name="validFrom" type="datetime-local" className="admin-input" />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.validUntil} ({t.optional})</label>
                      <input name="validUntil" type="datetime-local" className="admin-input" />
                    </div>
                  </div>
                </div>
                <div className="admin-modal-actions">
                  <button type="submit" className="admin-button success">
                    {t.save}
                  </button>
                  <button type="button" className="admin-button secondary" onClick={() => setShowModal(false)}>
                    {t.cancel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showCodesModal && currentType && (
          <div className="admin-modal-overlay" onClick={() => setShowCodesModal(false)}>
            <div className="admin-modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">
                  {t.codes} - {currentType.name}
                  {selectedCodes.size > 0 && (
                    <span style={{ fontSize: "0.85rem", opacity: 0.7, marginLeft: "0.5rem" }}>
                      ({t.selected.replace('{count}', selectedCodes.size.toString())})
                    </span>
                  )}
                </h2>
                <button className="admin-modal-close" onClick={() => setShowCodesModal(false)}>
                  ✕
                </button>
              </div>
              <div className="admin-controls">
                <button className="admin-button small secondary" onClick={toggleSelectAll}>
                  {selectedCodes.size === currentType.codes.length ? t.deselectAll : t.selectAll}
                </button>
                {selectedCodes.size > 0 && (
                  <button className="admin-button small danger" onClick={bulkDeleteInvitationCodes}>
                    {t.bulkDelete} ({selectedCodes.size})
                  </button>
                )}
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedCodes.size === currentType.codes.length && currentType.codes.length > 0}
                          onChange={toggleSelectAll}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>{t.code}</th>
                      <th>{t.usage}</th>
                      <th>{t.limit}</th>
                      <th>{t.status}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentType.codes.map(code => {
                      const status = !code.active ? "inactive" : code.usedCount >= code.usageLimit ? "usedup" : "active";
                      const statusClass = status === "active" ? "active" : "ended";
                      return (
                        <tr key={code.id}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={selectedCodes.has(code.id)}
                              onChange={() => toggleCodeSelection(code.id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td>{code.code}</td>
                          <td>{code.usedCount}</td>
                          <td>{code.usageLimit}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="admin-button small danger"
                              onClick={() => deleteInvitationCode(code.id)}
                            >
                              {t.delete}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
