"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { registrations as registrationsAPI, initializeAdminPage } from "@/lib/admin";

type Registration = {
  id: string;
  email?: string;
  formData?: any;
  status: string;
  createdAt?: string;
  ticket?: { name: string };
  event?: { name: string };
  tags?: string[];
};

export default function RegistrationsPage() {
  const locale = useLocale();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filtered, setFiltered] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeColumns, setActiveColumns] = useState(new Set(['id', 'email', 'status', 'ticket', 'event', 'createdAt']));

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
    { id: "email", label: "Email", accessor: (r: Registration) => r.email || r.formData?.email || "" },
    { id: "phone", label: "Phone", accessor: (r: Registration) => r.formData?.phoneNumber || "" },
    { id: "status", label: "Status", accessor: (r: Registration) => r.status },
    { id: "ticket", label: "Ticket", accessor: (r: Registration) => r.ticket?.name || "" },
    { id: "event", label: "Event", accessor: (r: Registration) => r.event?.name || "" },
    { id: "createdAt", label: "Created", accessor: (r: Registration) => r.createdAt ? new Date(r.createdAt).toLocaleString() : "" },
    { id: "tags", label: "Tags", accessor: (r: Registration) => Array.isArray(r.tags) ? r.tags.join(", ") : "" }
  ];

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await registrationsAPI.list(params);
      if (response.success) {
        setRegistrations(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    const init = async () => {
      const isAuthorized = await initializeAdminPage();
      if (!isAuthorized) return;
      await loadRegistrations();
    };
    init();
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
      await registrationsAPI.export({ format: 'sheets' });
      alert('Successfully synced to Google Sheets!');
    } catch (error: any) {
      alert('Sync failed: ' + error.message);
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
                fontSize: "0.85rem"
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
                fontSize: "0.85rem"
              }}
            >
              <option value="">{t.allStatus}</option>
              <option value="confirmed">{t.confirmed}</option>
              <option value="pending">{t.pending}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
            <button
              onClick={loadRegistrations}
              style={{
                background: "#1f1f1f",
                border: "1px solid #444",
                color: "#eee",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              ↻ {t.refresh}
            </button>
            <button
              onClick={syncToSheets}
              style={{
                background: "#24324a",
                border: "1px solid #355079",
                color: "#eee",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
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
                    background: "#222",
                    border: "1px solid #444",
                    padding: "4px 8px",
                    fontSize: "0.65rem",
                    borderRadius: "999px",
                    cursor: "pointer",
                    opacity: activeColumns.has(col.id) ? 1 : 0.45,
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
          {isLoading && (
            <div style={{ padding: "2rem", textAlign: "center", opacity: "0.7" }}>
              {t.loading}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", opacity: "0.7" }}>
              {t.empty}
            </div>
          )}
          {!isLoading && filtered.length > 0 && (
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: "0",
                fontSize: "0.75rem"
              }}
            >
              <thead>
                <tr>
                  {[...activeColumns].map(cid => {
                    const col = columnDefs.find(c => c.id === cid);
                    return col ? (
                      <th
                        key={cid}
                        style={{
                          position: "sticky",
                          top: "0",
                          background: "#161616",
                          padding: "8px 10px",
                          textAlign: "left",
                          fontWeight: "600",
                          borderBottom: "1px solid #333"
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
                  <tr
                    key={r.id}
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#191919";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {[...activeColumns].map(cid => {
                      const col = columnDefs.find(c => c.id === cid);
                      if (!col) return null;
                      const val = col.accessor(r);
                      const statusColor =
                        r.status === "confirmed"
                          ? "#4ade80"
                          : r.status === "pending"
                          ? "#fbbf24"
                          : r.status === "cancelled"
                          ? "#f87171"
                          : "#eee";
                      return (
                        <td
                          key={cid}
                          style={{
                            padding: "6px 10px",
                            borderBottom: "1px solid #222"
                          }}
                        >
                          {cid === 'status' ? (
                            <span
                              style={{
                                display: "inline-block",
                                background: "#222",
                                border: "1px solid #333",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                fontSize: "0.6rem",
                                textTransform: "uppercase",
                                color: statusColor
                              }}
                            >
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
