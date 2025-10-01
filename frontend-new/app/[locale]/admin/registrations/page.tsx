"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
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
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filtered, setFiltered] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeColumns, setActiveColumns] = useState(new Set(['id', 'email', 'status', 'ticket', 'event', 'createdAt']));

  const t = i18n.t(lang, {
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
        <section className="controls">
          <div className="row filters">
            <input
              type="text"
              placeholder={"🔍 " + t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{t.allStatus}</option>
              <option value="confirmed">{t.confirmed}</option>
              <option value="pending">{t.pending}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
            <button onClick={loadRegistrations}>↻ {t.refresh}</button>
            <button onClick={syncToSheets} className="secondary">📝 {t.syncSheets}</button>
          </div>
          <div className="row cols">
            <label>{t.columns}</label>
            <div className="toggles">
              {columnDefs.map(col => (
                <button
                  key={col.id}
                  className="toggle"
                  data-on={activeColumns.has(col.id) ? "true" : "false"}
                  onClick={() => {
                    const newCols = new Set(activeColumns);
                    if (newCols.has(col.id)) newCols.delete(col.id);
                    else newCols.add(col.id);
                    setActiveColumns(newCols);
                  }}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="table-wrapper">
          {isLoading && <div className="loading">{t.loading}</div>}
          {!isLoading && filtered.length === 0 && <div className="empty">{t.empty}</div>}
          {!isLoading && filtered.length > 0 && (
            <table className="reg-table">
              <thead>
                <tr>
                  {[...activeColumns].map(cid => {
                    const col = columnDefs.find(c => c.id === cid);
                    return col ? <th key={cid}>{col.label}</th> : null;
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
                      return (
                        <td key={cid}>
                          {cid === 'status' ? (
                            <span className={`label-pill status-${r.status}`}>{val}</span>
                          ) : (
                            <div className="truncate">{val}</div>
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

        <section className="meta">
          <div className="meta-info">{filtered.length} rows</div>
        </section>
      </main>

      <style jsx>{`
        .controls {
          margin: 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .controls input,
        .controls select {
          background: #111;
          border: 1px solid #333;
          color: #eee;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 0.85rem;
        }
        .controls button {
          background: #1f1f1f;
          border: 1px solid #444;
          color: #eee;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .controls button.secondary {
          background: #24324a;
          border-color: #355079;
        }
        .toggles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .toggle {
          background: #222;
          border: 1px solid #444;
          padding: 4px 8px;
          font-size: 0.65rem;
          border-radius: 999px;
          cursor: pointer;
        }
        .toggle[data-on="false"] {
          opacity: 0.45;
        }
        .loading,
        .empty {
          padding: 2rem;
          text-align: center;
          opacity: 0.7;
        }
        .reg-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.75rem;
        }
        .reg-table thead th {
          position: sticky;
          top: 0;
          background: #161616;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          border-bottom: 1px solid #333;
        }
        .reg-table tbody td {
          padding: 6px 10px;
          border-bottom: 1px solid #222;
        }
        .reg-table tbody tr:hover {
          background: #191919;
        }
        .label-pill {
          display: inline-block;
          background: #222;
          border: 1px solid #333;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.6rem;
          text-transform: uppercase;
        }
        .status-confirmed {
          color: #4ade80;
        }
        .status-pending {
          color: #fbbf24;
        }
        .status-cancelled {
          color: #f87171;
        }
        .truncate {
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .meta-info {
          margin: 1rem 0;
          font-size: 0.7rem;
          opacity: 0.75;
        }
      `}</style>
    </>
  );
}
