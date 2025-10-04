"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketsAPI, adminEventsAPI } from "@/lib/api/endpoints";
import type { Ticket, Event } from "@/lib/types/api";

export default function TicketsPage() {
  const locale = useLocale();

  const [events, setEvents] = useState<Event[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const t = getTranslations(locale, {
    title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
    selectEvent: { "zh-Hant": "選擇活動", "zh-Hans": "选择活动", en: "Select Event" },
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

  const loadEvents = useCallback(async () => {
    try {
      const response = await adminEventsAPI.getAll();
      if (response.success && response.data && response.data.length > 0) {
        setEvents(response.data);

        // Check localStorage for saved event selection
        const savedEventId = localStorage.getItem('selectedEventId');
        const eventExists = response.data.find(e => e.id === savedEventId);

        if (savedEventId && eventExists) {
          setCurrentEventId(savedEventId);
        } else {
          // Default to first event
          setCurrentEventId(response.data[0].id);
          localStorage.setItem('selectedEventId', response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  const handleEventChange = (eventId: string) => {
    setCurrentEventId(eventId);
    localStorage.setItem('selectedEventId', eventId);
  };

  const loadTickets = useCallback(async () => {
    if (!currentEventId) return;

    setIsLoading(true);
    try {
      const response = await adminTicketsAPI.getAll({ eventId: currentEventId });
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (currentEventId) {
      loadTickets();
    }
  }, [currentEventId, loadTickets]);

  const openModal = (ticket: Ticket | null = null) => {
    setEditingTicket(ticket);
    setShowModal(true);
  };

  function closeModal() {
    setShowModal(false);
    setEditingTicket(null);
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

  const getStatusBadgeStyle = (statusClass: string) => {
    const baseStyle: React.CSSProperties = {
      padding: '0.3rem 0.6rem',
      borderRadius: '4px',
      fontSize: '0.85rem',
      display: 'inline-block'
    };

    if (statusClass === 'active') {
      return { ...baseStyle, backgroundColor: '#d4edda', color: '#155724' };
    } else if (statusClass === 'ended') {
      return { ...baseStyle, backgroundColor: '#f8d7da', color: '#721c24' };
    } else if (statusClass === 'pending') {
      return { ...baseStyle, backgroundColor: '#fff3cd', color: '#856404' };
    }
    return baseStyle;
  };

  return (
    <>
      <AdminNav />
      <main>
        <h1>{t.title}</h1>

        <section style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxWidth: '400px'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.selectEvent}</span>
            <select
              value={currentEventId || ''}
              onChange={(e) => handleEventChange(e.target.value)}
              style={{
                padding: '0.75rem',
                border: '2px solid var(--color-gray-600)',
                background: 'var(--color-gray-800)',
                color: 'inherit',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <div style={{
            overflowX: 'auto',
            borderRadius: '8px',
            backgroundColor: 'var(--color-gray-800)',
            border: '2px solid var(--color-gray-900)'
          }}>
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
                  }}>{t.ticketTypes}</th>
                  <th style={{
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--color-gray-400)',
                    backgroundColor: 'var(--color-gray-700)',
                    color: 'var(--color-gray-200)',
                    fontWeight: 600
                  }}>{t.startTime}</th>
                  <th style={{
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--color-gray-400)',
                    backgroundColor: 'var(--color-gray-700)',
                    color: 'var(--color-gray-200)',
                    fontWeight: 600
                  }}>{t.endTime}</th>
                  <th style={{
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--color-gray-400)',
                    backgroundColor: 'var(--color-gray-700)',
                    color: 'var(--color-gray-200)',
                    fontWeight: 600
                  }}>{t.status}</th>
                  <th style={{
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--color-gray-400)',
                    backgroundColor: 'var(--color-gray-700)',
                    color: 'var(--color-gray-200)',
                    fontWeight: 600
                  }}>{t.quantity}</th>
                  <th style={{
                    padding: '0.5rem 1rem',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--color-gray-400)',
                    backgroundColor: 'var(--color-gray-700)',
                    color: 'var(--color-gray-200)',
                    fontWeight: 600
                  }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const status = computeStatus(ticket);
                  return (
                    <tr key={ticket.id}>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>{ticket.name}</td>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>{formatDateTime(ticket.saleStart)}</td>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>{formatDateTime(ticket.saleEnd)}</td>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>
                        <span style={getStatusBadgeStyle(status.class)}>{status.label}</span>
                      </td>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>{ticket.quantity}</td>
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button className="button" onClick={() => openModal(ticket)}>{t.editTicket}</button>
                          <button
                            className="button"
                            style={{ backgroundColor: '#2563eb', color: '#fff' }}
                            onClick={() => window.location.href = `/${locale}/admin/forms?ticket=${ticket.id}`}
                          >
                            {t.editForms}
                          </button>
                          <button className="button" style={{ backgroundColor: '#f8d7da', color: '#721c24' }} onClick={() => deleteTicket(ticket.id)}>{t.delete}</button>
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
          <button className="button" onClick={() => openModal()}>
            + {t.addTicket}
          </button>
        </section>

        {showModal && (
          <div style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }} onClick={closeModal}>
            <div style={{
              background: 'var(--color-gray-800)',
              padding: '1.5rem',
              borderRadius: '12px',
              maxWidth: '640px',
              width: '100%'
            }} onClick={(e) => e.stopPropagation()}>
              <h2>{editingTicket ? t.editTicket : t.addTicket}</h2>
              <form onSubmit={saveTicket}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span>{t.ticketName}</span>
                    <input name="name" type="text" required defaultValue={editingTicket?.name || ''} style={{
                      padding: '0.5rem',
                      border: '1px solid var(--color-gray-600)',
                      background: 'var(--color-gray-900)',
                      color: 'inherit',
                      borderRadius: '6px'
                    }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span>{t.description}</span>
                    <textarea name="description" defaultValue={editingTicket?.description || ''} style={{
                      padding: '0.5rem',
                      border: '1px solid var(--color-gray-600)',
                      background: 'var(--color-gray-900)',
                      color: 'inherit',
                      borderRadius: '6px',
                      minHeight: '80px'
                    }} />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span>{t.price}</span>
                      <input name="price" type="number" min="0" defaultValue={editingTicket?.price || 0} style={{
                        padding: '0.5rem',
                        border: '1px solid var(--color-gray-600)',
                        background: 'var(--color-gray-900)',
                        color: 'inherit',
                        borderRadius: '6px'
                      }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span>{t.quantity}</span>
                      <input name="quantity" type="number" min="0" defaultValue={editingTicket?.quantity || 0} style={{
                        padding: '0.5rem',
                        border: '1px solid var(--color-gray-600)',
                        background: 'var(--color-gray-900)',
                        color: 'inherit',
                        borderRadius: '6px'
                      }} />
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span>{t.startTime}</span>
                      <input
                        name="saleStart"
                        type="datetime-local"
                        defaultValue={editingTicket?.saleStart ? new Date(editingTicket.saleStart).toISOString().slice(0, 16) : ''}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid var(--color-gray-600)',
                          background: 'var(--color-gray-900)',
                          color: 'inherit',
                          borderRadius: '6px'
                        }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span>{t.endTime}</span>
                      <input
                        name="saleEnd"
                        type="datetime-local"
                        defaultValue={editingTicket?.saleEnd ? new Date(editingTicket.saleEnd).toISOString().slice(0, 16) : ''}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid var(--color-gray-600)',
                          background: 'var(--color-gray-900)',
                          color: 'inherit',
                          borderRadius: '6px'
                        }}
                      />
                    </label>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      name="requireInviteCode"
                      type="checkbox"
                      defaultChecked={editingTicket?.requireInviteCode || false}
                      style={{
                        width: '18px',
                        height: '18px'
                      }}
                    />
                    <span>{t.requireInviteCode}</span>
                  </label>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  justifyContent: 'flex-end'
                }}>
                  <button type="submit" className="button" style={{ background: '#ffc107', color: '#2a2416' }}>{t.save}</button>
                  <button type="button" className="button" onClick={closeModal}>{t.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
