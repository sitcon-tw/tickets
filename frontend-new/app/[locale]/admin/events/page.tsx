"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminEventsAPI } from "@/lib/api/endpoints";
import type { Event } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

export default function EventsPage() {
  const locale = useLocale();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const t = getTranslations(locale, {
    title: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Event Management" },
    addEvent: { "zh-Hant": "新增活動", "zh-Hans": "新增活动", en: "Add Event" },
    editEvent: { "zh-Hant": "編輯活動", "zh-Hans": "编辑活动", en: "Edit Event" },
    eventName: { "zh-Hant": "活動名稱", "zh-Hans": "活动名称", en: "Event Name" },
    description: { "zh-Hant": "描述", "zh-Hans": "描述", en: "Description" },
    location: { "zh-Hant": "地點", "zh-Hans": "地点", en: "Location" },
    startDate: { "zh-Hant": "開始日期", "zh-Hans": "开始日期", en: "Start Date" },
    endDate: { "zh-Hant": "結束日期", "zh-Hans": "结束日期", en: "End Date" },
    status: { "zh-Hant": "狀態", "zh-Hans": "状态", en: "Status" },
    actions: { "zh-Hant": "操作", "zh-Hans": "操作", en: "Actions" },
    save: { "zh-Hant": "儲存", "zh-Hans": "保存", en: "Save" },
    cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" },
    delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
    edit: { "zh-Hant": "編輯", "zh-Hans": "编辑", en: "Edit" },
    loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Now Loading..." },
    empty: { "zh-Hant": "沒有活動", "zh-Hans": "没有活动", en: "No events" },
    active: { "zh-Hant": "進行中", "zh-Hans": "进行中", en: "Active" },
    upcoming: { "zh-Hant": "即將開始", "zh-Hans": "即将开始", en: "Upcoming" },
    ended: { "zh-Hant": "已結束", "zh-Hans": "已结束", en: "Ended" },
    createdAt: { "zh-Hant": "建立時間", "zh-Hans": "创建时间", en: "Created At" }
  });

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminEventsAPI.getAll();
      if (response.success) {
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const openModal = (event: Event | null = null) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const saveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;

    const data: {
      name: string;
      description: string;
      location: string;
      startDate?: string;
      endDate?: string;
    } = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || '',
      location: formData.get('location') as string || '',
    };

    if (startDateStr) {
      data.startDate = new Date(startDateStr).toISOString();
    }
    if (endDateStr) {
      data.endDate = new Date(endDateStr).toISOString();
    }

    try {
      if (editingEvent) {
        await adminEventsAPI.update(editingEvent.id, data);
      } else {
        await adminEventsAPI.create(data);
      }
      await loadEvents();
      closeModal();
    } catch (error) {
      alert('保存失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('確定要刪除這個活動嗎？')) return;

    try {
      await adminEventsAPI.delete(eventId);
      await loadEvents();
    } catch (error) {
      alert('刪除失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const computeStatus = (event: Event) => {
    const now = new Date();
    if (event.startDate && new Date(event.startDate) > now) {
      return { label: t.upcoming, class: "pending" };
    }
    if (event.endDate && new Date(event.endDate) < now) {
      return { label: t.ended, class: "ended" };
    }
    return { label: t.active, class: "active" };
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

        <section style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxWidth: '400px'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.title}</span>
          </label>
        </section>

        <section>
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
              <p style={{ fontSize: '0.9rem' }}>{t.loading}</p>
            </div>
          )}
          {!isLoading && events.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", opacity: "0.7" }}>
              {t.empty}
            </div>
          )}
          {!isLoading && events.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.75rem"
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
                    {t.eventName}
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
                    {t.location}
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
                    {t.startDate}
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
                    {t.endDate}
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
                {events.map(event => {
                  const status = computeStatus(event);
                  return (
                    <tr key={event.id}>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {event.name}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {event.location}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {formatDateTime(event.startDate)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        {formatDateTime(event.endDate)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        <span
                          style={{
                            display: "inline-block",
                            background: "#222",
                            border: "1px solid #333",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "0.6rem",
                            textTransform: "uppercase",
                            color: status.color
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "left", borderBottom: "1px solid #333" }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => openModal(event)}
                            style={{
                              background: "#222",
                              border: "1px solid #444",
                              color: "#eee",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              cursor: "pointer"
                            }}
                          >
                            {t.edit}
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            style={{
                              background: "#2a1616",
                              border: "1px solid #441111",
                              color: "#f87171",
                              borderRadius: "4px",
                              padding: "4px 8px",
                              fontSize: "0.7rem",
                              cursor: "pointer"
                            }}
                          >
                            {t.delete}
                          </button>
                        </div>
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
            onClick={closeModal}
          >
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem 1.2rem",
                maxWidth: "640px",
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
                  {editingEvent ? t.editEvent : t.addEvent}
                </h2>
                <button
                  onClick={closeModal}
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
                onSubmit={saveEvent}
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
                  {t.eventName}
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingEvent?.name || ''}
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
                  {t.description}
                  <textarea
                    name="description"
                    defaultValue={editingEvent?.description || ''}
                    style={{
                      background: "#111",
                      border: "1px solid #333",
                      color: "#eee",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      fontSize: "0.8rem",
                      minHeight: "80px"
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
                  {t.location}
                  <input
                    name="location"
                    type="text"
                    defaultValue={editingEvent?.location || ''}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.3rem",
                      fontSize: "0.75rem"
                    }}
                  >
                    {t.startDate}
                    <input
                      name="startDate"
                      type="datetime-local"
                      defaultValue={editingEvent?.startDate ? new Date(editingEvent.startDate).toISOString().slice(0, 16) : ''}
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
                    {t.endDate}
                    <input
                      name="endDate"
                      type="datetime-local"
                      defaultValue={editingEvent?.endDate ? new Date(editingEvent.endDate).toISOString().slice(0, 16) : ''}
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
                </div>
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
                    onClick={closeModal}
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
