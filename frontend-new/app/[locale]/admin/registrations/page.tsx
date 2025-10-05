"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminRegistrationsAPI } from "@/lib/api/endpoints";
import type { Registration } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

export default function RegistrationsPage() {
  const locale = useLocale();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filtered, setFiltered] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [activeColumns, setActiveColumns] = useState(new Set(['id', 'status', 'ticket', 'event', 'createdAt']));

  const t = getTranslations(locale, {
    title: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
    search: { "zh-Hant": "搜尋", "zh-Hans": "搜索", en: "Search" },
    allStatus: { "zh-Hant": "全部狀態", "zh-Hans": "全部状态", en: "All statuses" },
    confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
    pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
    cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
    refresh: { "zh-Hant": "重新整理", "zh-Hans": "重新整理", en: "Refresh" },
    syncSheets: { "zh-Hant": "同步到 Google Sheets", "zh-Hans": "同步到 Google Sheets", en: "Sync to Google Sheets" },
    columns: { "zh-Hant": "欄位", "zh-Hans": "栏位", en: "Columns" },
    loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
    empty: { "zh-Hant": "沒有資料", "zh-Hans": "没有资料", en: "No data" }
  });

  const columnDefs = [
    { id: "id", label: "ID", accessor: (r: Registration) => r.id },
    { id: "status", label: "Status", accessor: (r: Registration) => r.status },
    { id: "ticket", label: "Ticket", accessor: (r: Registration) => r.ticket?.name || r.ticketId || "" },
    { id: "event", label: "Event", accessor: (r: Registration) => r.event?.name || r.eventId || "" },
    { id: "createdAt", label: "Created", accessor: (r: Registration) => r.createdAt ? new Date(r.createdAt).toLocaleString() : "" },
    { id: "tags", label: "Tags", accessor: () => "" }
  ];

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

  const loadRegistrations = useCallback(async () => {
    if (!currentEventId) return;

    setIsLoading(true);
    try {
      const params: { limit: number; status?: 'pending' | 'confirmed' | 'cancelled'; eventId?: string } = {
        limit: 100,
        eventId: currentEventId
      };
      if (statusFilter) params.status = statusFilter as 'pending' | 'confirmed' | 'cancelled';

      const response = await adminRegistrationsAPI.getAll(params);
      if (response.success) {
        setRegistrations(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, currentEventId]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const filtered = registrations.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const hay = JSON.stringify(r).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    setFiltered(filtered);
  }, [registrations, searchTerm, statusFilter]);

  const syncToSheets = async () => {
    try {
      await adminRegistrationsAPI.export({ format: 'excel' });
      alert('Successfully exported data!');
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <>
      <AdminNav />
      <main>
        <h1>{t.title}</h1>
        <section
          style={{
            margin: "1rem 0",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center"
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
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: "#111",
                border: "1px solid #333",
                color: "#eee",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "0.75rem"
              }}
            >
              <option value="">{t.allStatus}</option>
              <option value="confirmed">{t.confirmed}</option>
              <option value="pending">{t.pending}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
            <button
              onClick={loadRegistrations}
              className="button"
            >
              ↻ {t.refresh}
            </button>
            <button
              onClick={syncToSheets}
              className="button"
              style={{ backgroundColor: '#2563eb', color: '#fff' }}
            >
              📝 {t.syncSheets}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              alignItems: "center"
            }}
          >
            <label>{t.columns}</label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem"
              }}
            >
              {columnDefs.map(col => (
                <button
                  key={col.id}
                  data-on={activeColumns.has(col.id) ? "true" : "false"}
                  onClick={() => {
                    const newCols = new Set(activeColumns);
                    if (newCols.has(col.id)) newCols.delete(col.id);
                    else newCols.add(col.id);
                    setActiveColumns(newCols);
                  }}
                  style={{
                    background: activeColumns.has(col.id) ? "#2a2a2a" : "#1a1a1a",
                    border: "1px solid #444",
                    padding: "4px 8px",
                    fontSize: "0.65rem",
                    borderRadius: "999px",
                    cursor: "pointer",
                    opacity: activeColumns.has(col.id) ? 1 : 0.5,
                    color: "#eee"
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
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
                <p style={{ fontSize: '0.9rem' }}>{t.loading}</p>
              </div>
            )}
            {!isLoading && filtered.length === 0 && (
              <div style={{ padding: "2rem", textAlign: "center", opacity: "0.7" }}>
                {t.empty}
              </div>
            )}
            {!isLoading && filtered.length > 0 && (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                minWidth: '900px'
              }}>
                <thead>
                  <tr>
                    {[...activeColumns].map(cid => {
                      const col = columnDefs.find(c => c.id === cid);
                      return col ? (
                        <th
                          key={cid}
                          style={{
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            borderBottom: '1px solid var(--color-gray-400)',
                            backgroundColor: 'var(--color-gray-700)',
                            color: 'var(--color-gray-200)',
                            fontWeight: 600
                          }}
                        >
                          {col.label}
                        </th>
                      ) : null;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      {[...activeColumns].map(cid => {
                        const col = columnDefs.find(c => c.id === cid);
                        if (!col) return null;
                        const val = col.accessor(r);
                        const statusClass =
                          r.status === "confirmed"
                            ? "active"
                            : r.status === "pending"
                            ? "pending"
                            : r.status === "cancelled"
                            ? "ended"
                            : "";
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
                          <td
                            key={cid}
                            style={{
                              padding: '0.5rem 1rem',
                              textAlign: 'left',
                              borderBottom: '1px solid var(--color-gray-400)'
                            }}
                          >
                            {cid === 'status' ? (
                              <span style={getStatusBadgeStyle(statusClass)}>
                                {val}
                              </span>
                            ) : (
                              <div
                                style={{
                                  maxWidth: "220px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {val}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <div
            style={{
              margin: "1rem 0",
              fontSize: "0.7rem",
              opacity: "0.75"
            }}
          >
            {filtered.length} rows
          </div>
        </section>
      </main>
    </>
  );
}
