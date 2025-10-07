"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import MarkdownContent from "@/components/MarkdownContent";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketsAPI } from "@/lib/api/endpoints";
import type { Ticket } from "@/lib/types/api";

export default function TicketsPage() {
  const locale = useLocale();

  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [descriptionPreview, setDescriptionPreview] = useState('');

  const t = getTranslations(locale, {
    title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
    ticketTypes: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Types" },
    startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start Time" },
    endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End Time" },
    status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
    quantity: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Quantity" },
    actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
    addTicket: { "zh-Hant": "新增票種", "zh-Hans": "新增票种", en: "Add Ticket" },
    editTicket: { "zh-Hant": "編輯票種", "zh-Hans": "编辑票种", en: "Edit Ticket" },
    editForms: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Forms" },
    save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
    cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
    delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
    ticketName: { "zh-Hant": "票種名稱", "zh-Hans": "票种名称", en: "Ticket Name" },
    description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
    price: { "zh-Hant": "價格", "zh-Hans": "价格", en: "Price" },
    requireInviteCode: { "zh-Hant": "需要邀請碼", "zh-Hans": "需要邀请码", en: "Require Invite Code" },
    selling: { "zh-Hant": "販售中", "zh-Hans": "贩售中", en: "Selling" },
    notStarted: { "zh-Hant": "尚未開始販售", "zh-Hans": "尚未开始贩售", en: "Not Started" },
    ended: { "zh-Hant": "已結束販售", "zh-Hans": "已结束贩售", en: "Ended" }
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

  const loadTickets = useCallback(async () => {
    if (!currentEventId) return;

    try {
      const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
    }
  }, [currentEventId]);

  useEffect(() => {
    if (currentEventId) {
      loadTickets();
    }
  }, [currentEventId, loadTickets]);

  const openModal = (ticket: Ticket | null = null) => {
    setEditingTicket(ticket);
    setDescriptionPreview(ticket?.description || '');
    setShowModal(true);
  };

  function closeModal() {
    setShowModal(false);
    setEditingTicket(null);
    setDescriptionPreview('');
  };

  const saveTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEventId) return;

    const formData = new FormData(e.currentTarget);
    const saleStartStr = formData.get('saleStart') as string;
    const saleEndStr = formData.get('saleEnd') as string;

    const data: {
      eventId: string;
      name: string;
      description: string;
      price: number;
      quantity: number;
      requireInviteCode: boolean;
      saleStart?: string;
      saleEnd?: string;
    } = {
      eventId: currentEventId,
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      price: parseInt(formData.get('price') as string) || 0,
      quantity: parseInt(formData.get('quantity') as string) || 0,
      requireInviteCode: formData.get('requireInviteCode') === 'on',
    };

    // Convert datetime-local to ISO format if provided
    if (saleStartStr) {
      data.saleStart = new Date(saleStartStr).toISOString();
    }
    if (saleEndStr) {
      data.saleEnd = new Date(saleEndStr).toISOString();
    }

    try {
      if (editingTicket) {
        await adminTicketsAPI.update(editingTicket.id, data);
      } else {
        await adminTicketsAPI.create(data);
      }
      await loadTickets();
      closeModal();
    } catch (error) {
      alert('保存失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!confirm('確定要刪除這個票種嗎？')) return;

    try {
      await adminTicketsAPI.delete(ticketId);
      await loadTickets();
    } catch (error) {
      alert('刪除失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const computeStatus = (ticket: Ticket) => {
    const now = new Date();
    if (ticket.saleStart && new Date(ticket.saleStart) > now) {
      return { label: t.notStarted, class: "pending" };
    }
    if (ticket.saleEnd && new Date(ticket.saleEnd) < now) {
      return { label: t.ended, class: "ended" };
    }
    return { label: t.selling, class: "active" };
  };

  const formatDateTime = (dt?: string) => {
    if (!dt) return '';
    try {
      const d = new Date(dt);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dt;
    }
  };

  return (
    <>
      <AdminNav />
      <main>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="h-8" />

        <section>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.ticketTypes}</th>
                  <th>{t.startTime}</th>
                  <th>{t.endTime}</th>
                  <th>{t.status}</th>
                  <th>{t.quantity}</th>
                  <th>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const status = computeStatus(ticket);
                  return (
                    <tr key={ticket.id}>
                      <td>{ticket.name}</td>
                      <td>{formatDateTime(ticket.saleStart)}</td>
                      <td>{formatDateTime(ticket.saleEnd)}</td>
                      <td>
                        <span className={`status-badge ${status.class}`}>{status.label}</span>
                      </td>
                      <td>{ticket.quantity}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="admin-button small secondary" onClick={() => openModal(ticket)}>{t.editTicket}</button>
                          <button
                            className="admin-button small primary"
                            onClick={() => window.location.href = `/${locale}/admin/forms?ticket=${ticket.id}`}
                          >
                            {t.editForms}
                          </button>
                          <button className="admin-button small danger" onClick={() => deleteTicket(ticket.id)}>{t.delete}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="admin-button primary" onClick={() => openModal()}>
            + {t.addTicket}
          </button>
        </section>

        {showModal && (
          <div className="admin-modal-overlay" onClick={closeModal}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">{editingTicket ? t.editTicket : t.addTicket}</h2>
                <button className="admin-modal-close" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={saveTicket}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t.ticketName}</label>
                    <input name="name" type="text" required defaultValue={editingTicket?.name || ''} className="admin-input" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">{t.description} (Markdown)</label>
                    <textarea
                      name="description"
                      value={descriptionPreview}
                      onChange={(e) => setDescriptionPreview(e.target.value)}
                      className="admin-textarea"
                      rows={6}
                    />
                    {descriptionPreview && (
                      <div style={{ marginTop: '0.5rem', padding: '0.75rem', border: '1px solid var(--color-gray-600)', borderRadius: '4px', backgroundColor: 'var(--color-gray-750)' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-gray-300)' }}>Preview:</div>
                        <MarkdownContent content={descriptionPreview} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.price}</label>
                      <input name="price" type="number" min="0" defaultValue={editingTicket?.price || 0} className="admin-input" />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.quantity}</label>
                      <input name="quantity" type="number" min="0" defaultValue={editingTicket?.quantity || 0} className="admin-input" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.startTime}</label>
                      <input
                        name="saleStart"
                        type="datetime-local"
                        defaultValue={editingTicket?.saleStart ? new Date(editingTicket.saleStart).toISOString().slice(0, 16) : ''}
                        className="admin-input"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label">{t.endTime}</label>
                      <input
                        name="saleEnd"
                        type="datetime-local"
                        defaultValue={editingTicket?.saleEnd ? new Date(editingTicket.saleEnd).toISOString().slice(0, 16) : ''}
                        className="admin-input"
                      />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      name="requireInviteCode"
                      type="checkbox"
                      defaultChecked={editingTicket?.requireInviteCode || false}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span className="admin-form-label" style={{ marginBottom: 0 }}>{t.requireInviteCode}</span>
                  </label>
                </div>
                <div className="admin-modal-actions">
                  <button type="submit" className="admin-button warning">{t.save}</button>
                  <button type="button" className="admin-button secondary" onClick={closeModal}>{t.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
