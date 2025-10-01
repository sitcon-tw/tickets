"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
import { tickets as ticketsAPI, events as eventsAPI, initializeAdminPage } from "@/lib/admin";

type Ticket = {
  id: string;
  name: string;
  saleStart?: string;
  saleEnd?: string;
  quantity?: number | string;
  isActive?: boolean;
};

export default function TicketsPage() {
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  const t = i18n.t(lang, {
    title: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
    ticketTypes: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket Types" },
    startTime: { "zh-Hant": "開始時間", "zh-Hans": "开始时间", en: "Start Time" },
    endTime: { "zh-Hant": "結束時間", "zh-Hans": "结束时间", en: "End Time" },
    status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
    quantity: { "zh-Hant": "數量", "zh-Hans": "数量", en: "Quantity" },
    actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
    addTicket: { "zh-Hant": "新增票種", "zh-Hans": "新增票种", en: "Add Ticket" },
    editTicket: { "zh-Hant": "編輯票種", "zh-Hans": "编辑票种", en: "Edit Ticket" },
    save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
    cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
    ticketName: { "zh-Hant": "票種名稱", "zh-Hans": "票种名称", en: "Ticket Name" },
    selling: { "zh-Hant": "販售中", "zh-Hans": "贩售中", en: "Selling" },
    notStarted: { "zh-Hant": "尚未開始販售", "zh-Hans": "尚未开始贩售", en: "Not Started" },
    ended: { "zh-Hant": "已結束販售", "zh-Hans": "已结束贩售", en: "Ended" }
  });

  const loadEvents = useCallback(async () => {
    try {
      const response = await eventsAPI.list();
      if (response.success && response.data && response.data.length > 0) {
        setCurrentEventId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }, []);

  const loadTickets = useCallback(async () => {
    if (!currentEventId) return;

    setIsLoading(true);
    try {
      const response = await ticketsAPI.list(currentEventId);
      if (response.success) {
        setTickets(response.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    const init = async () => {
      const isAuthorized = await initializeAdminPage();
      if (!isAuthorized) return;
      await loadEvents();
    };
    init();
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

  const closeModal = () => {
    setShowModal(false);
    setEditingTicket(null);
  };

  const saveTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEventId) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      saleStart: formData.get('saleStart') as string || null,
      saleEnd: formData.get('saleEnd') as string || null,
      quantity: parseInt(formData.get('quantity') as string) || 0,
      isActive: true
    };

    try {
      if (editingTicket) {
        await ticketsAPI.update(currentEventId, editingTicket.id, data);
      } else {
        await ticketsAPI.create(currentEventId, data);
      }
      await loadTickets();
      closeModal();
    } catch (error: any) {
      alert('保存失敗: ' + error.message);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!currentEventId || !confirm('確定要刪除這個票種嗎？')) return;

    try {
      await ticketsAPI.delete(currentEventId, ticketId);
      await loadTickets();
    } catch (error: any) {
      alert('刪除失敗: ' + error.message);
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
        <h1>{t.title}</h1>

        <section className="ticket-overview">
          <div className="table-container">
            <table className="tickets-table">
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
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button className="button" onClick={() => openModal(ticket)}>{t.editTicket}</button>
                          <button className="button delete" onClick={() => deleteTicket(ticket.id)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="add-ticket-section">
          <button className="button add-ticket-btn" onClick={() => openModal()}>
            + {t.addTicket}
          </button>
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingTicket ? t.editTicket : t.addTicket}</h2>
              <form onSubmit={saveTicket}>
                <div className="form-grid">
                  <label>
                    <span>{t.ticketName}</span>
                    <input name="name" type="text" required defaultValue={editingTicket?.name || ''} />
                  </label>
                  <label>
                    <span>{t.startTime}</span>
                    <input name="saleStart" type="datetime-local" defaultValue={editingTicket?.saleStart || ''} />
                  </label>
                  <label>
                    <span>{t.endTime}</span>
                    <input name="saleEnd" type="datetime-local" defaultValue={editingTicket?.saleEnd || ''} />
                  </label>
                  <label>
                    <span>{t.quantity}</span>
                    <input name="quantity" type="number" min="0" defaultValue={editingTicket?.quantity || 0} />
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="submit" className="button primary">{t.save}</button>
                  <button type="button" className="button" onClick={closeModal}>{t.cancel}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .table-container {
          overflow-x: auto;
          border-radius: 8px;
          background-color: var(--color-gray-800);
          border: 2px solid var(--color-gray-900);
        }
        .tickets-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 900px;
        }
        .tickets-table th,
        .tickets-table td {
          padding: 0.5rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--color-gray-400);
        }
        .tickets-table th {
          background-color: var(--color-gray-700);
          color: var(--color-gray-200);
          font-weight: 600;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .status-badge {
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.85rem;
          display: inline-block;
        }
        .status-badge.active {
          background-color: #d4edda;
          color: #155724;
        }
        .status-badge.ended {
          background-color: #f8d7da;
          color: #721c24;
        }
        .status-badge.pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .add-ticket-section {
          margin-top: 2rem;
          text-align: center;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal {
          background: var(--color-gray-800);
          padding: 1.5rem;
          border-radius: 12px;
          max-width: 640px;
          width: 100%;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }
        .form-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-grid input {
          padding: 0.5rem;
          border: 1px solid var(--color-gray-600);
          background: var(--color-gray-900);
          color: inherit;
          border-radius: 6px;
        }
        .modal-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
          justify-content: flex-end;
        }
        .button.primary {
          background: #ffc107;
          color: #2a2416;
        }
        .button.delete {
          background-color: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </>
  );
}
