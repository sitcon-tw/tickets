"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminRegistrationsAPI } from "@/lib/api/endpoints";
import type { Registration } from "@/lib/types/api";
import PageSpinner from "@/components/PageSpinner";

type SortField = 'id' | 'email' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function RegistrationsPage() {
  const locale = useLocale();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filtered, setFiltered] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [activeColumns, setActiveColumns] = useState(new Set(['email', 'status', 'ticket', 'event', 'createdAt']));
  const [selectedRegistrations, setSelectedRegistrations] = useState<Set<string>>(new Set());
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const t = getTranslations(locale, {
    title: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
    search: { "zh-Hant": "搜尋電子郵件、ID", "zh-Hans": "搜索电子邮件、ID", en: "Search Email, ID" },
    allStatus: { "zh-Hant": "全部狀態", "zh-Hans": "全部状态", en: "All statuses" },
    confirmed: { "zh-Hant": "已確認", "zh-Hans": "已确认", en: "Confirmed" },
    pending: { "zh-Hant": "待處理", "zh-Hans": "待处理", en: "Pending" },
    cancelled: { "zh-Hant": "已取消", "zh-Hans": "已取消", en: "Cancelled" },
    refresh: { "zh-Hant": "重新整理", "zh-Hans": "重新整理", en: "Refresh" },
    syncSheets: { "zh-Hant": "匯出 Excel", "zh-Hans": "导出 Excel", en: "Export Excel" },
    columns: { "zh-Hant": "欄位", "zh-Hans": "栏位", en: "Columns" },
    loading: { "zh-Hant": "載入中...", "zh-Hans": "载入中...", en: "Loading..." },
    empty: { "zh-Hant": "沒有資料", "zh-Hans": "没有资料", en: "No data" },
    total: { "zh-Hant": "總計", "zh-Hans": "总计", en: "Total" },
    selected: { "zh-Hant": "已選取", "zh-Hans": "已选取", en: "Selected" },
    selectAll: { "zh-Hant": "全選", "zh-Hans": "全选", en: "Select All" },
    deselectAll: { "zh-Hant": "取消全選", "zh-Hans": "取消全选", en: "Deselect All" },
    exportSelected: { "zh-Hant": "匯出選取", "zh-Hans": "导出选取", en: "Export Selected" },
    viewDetails: { "zh-Hant": "檢視詳情", "zh-Hans": "查看详情", en: "View Details" },
    close: { "zh-Hant": "關閉", "zh-Hans": "关闭", en: "Close" },
    registrationDetails: { "zh-Hant": "報名詳情", "zh-Hans": "报名详情", en: "Registration Details" },
    formData: { "zh-Hant": "表單資料", "zh-Hans": "表单资料", en: "Form Data" },
    referredBy: { "zh-Hant": "推薦人", "zh-Hans": "推荐人", en: "Referred By" },
    page: { "zh-Hant": "頁", "zh-Hans": "页", en: "Page" },
    of: { "zh-Hant": "共", "zh-Hans": "共", en: "of" },
    perPage: { "zh-Hant": "每頁筆數", "zh-Hans": "每页笔数", en: "Per Page" },
    stats: { "zh-Hant": "統計", "zh-Hans": "统计", en: "Statistics" }
  });

  const columnDefs = [
    { id: "id", label: "ID", accessor: (r: Registration) => r.id.slice(0, 8) + '...', sortable: true },
    { id: "email", label: "Email", accessor: (r: Registration) => r.email, sortable: true },
    { id: "status", label: "Status", accessor: (r: Registration) => r.status, sortable: true },
    { id: "ticket", label: "Ticket", accessor: (r: Registration) => r.ticket?.name || r.ticketId || "", sortable: false },
    { id: "event", label: "Event", accessor: (r: Registration) => r.event?.name || r.eventId || "", sortable: false },
    { id: "referredBy", label: "Referred By", accessor: (r: Registration) => r.referredBy ? r.referredBy.slice(0, 8) + '...' : '-', sortable: false },
    { id: "createdAt", label: "Created", accessor: (r: Registration) => r.createdAt ? new Date(r.createdAt).toLocaleString() : "", sortable: true },
    { id: "updatedAt", label: "Updated", accessor: (r: Registration) => r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "", sortable: false }
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

  // Statistics
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      confirmed: registrations.filter(r => r.status === 'confirmed').length,
      pending: registrations.filter(r => r.status === 'pending').length,
      cancelled: registrations.filter(r => r.status === 'cancelled').length,
    };
  }, [registrations]);

  // Filter and sort
  const sortedAndFiltered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let filtered = registrations.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const emailMatch = r.email.toLowerCase().includes(q);
        const idMatch = r.id.toLowerCase().includes(q);
        if (!emailMatch && !idMatch) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'id':
          aVal = a.id;
          bVal = b.id;
          break;
        case 'email':
          aVal = a.email;
          bVal = b.email;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [registrations, searchTerm, statusFilter, sortField, sortDirection]);

  // Paginate
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sortedAndFiltered.slice(start, end);
  }, [sortedAndFiltered, page, pageSize]);

  const totalPages = Math.ceil(sortedAndFiltered.length / pageSize);

  useEffect(() => {
    setFiltered(sortedAndFiltered);
  }, [sortedAndFiltered]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRegistrations.size === paginatedData.length) {
      setSelectedRegistrations(new Set());
    } else {
      setSelectedRegistrations(new Set(paginatedData.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedRegistrations);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRegistrations(newSet);
  };

  const openDetailModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedRegistration(null);
    setShowDetailModal(false);
  };

  const syncToSheets = async () => {
    try {
      const params: { format: 'excel'; eventId?: string } = { format: 'excel' };
      if (currentEventId) params.eventId = currentEventId;

      const response = await adminRegistrationsAPI.export(params);
      if (response.success && response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      } else {
        alert('Successfully exported data!');
      }
    } catch (error) {
      alert('Export failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const exportSelected = async () => {
    if (selectedRegistrations.size === 0) {
      alert('Please select at least one registration');
      return;
    }
    // This would need backend support for exporting specific IDs
    alert(`Exporting ${selectedRegistrations.size} selected registrations (feature needs backend support)`);
  };

  return (
    <>
      <AdminNav />
      <main>
        <h1>{t.title}</h1>

        {/* Statistics Section */}
        <section style={{ margin: "1rem 0" }}>
          <h3 style={{ marginBottom: "0.75rem", fontSize: "0.9rem", opacity: 0.8 }}>{t.stats}</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.75rem"
          }}>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "0.75rem 1rem"
            }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>{t.total}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600 }}>{stats.total}</div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #2d5",
              borderRadius: "8px",
              padding: "0.75rem 1rem"
            }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>{t.confirmed}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#2d5" }}>{stats.confirmed}</div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #fa3",
              borderRadius: "8px",
              padding: "0.75rem 1rem"
            }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>{t.pending}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fa3" }}>{stats.pending}</div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #f55",
              borderRadius: "8px",
              padding: "0.75rem 1rem"
            }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>{t.cancelled}</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 600, color: "#f55" }}>{stats.cancelled}</div>
            </div>
          </div>
        </section>

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
              📥 {t.syncSheets}
            </button>
            {selectedRegistrations.size > 0 && (
              <>
                <button
                  onClick={exportSelected}
                  className="button"
                  style={{ backgroundColor: '#059669', color: '#fff' }}
                >
                  📤 {t.exportSelected} ({selectedRegistrations.size})
                </button>
                <button
                  onClick={() => setSelectedRegistrations(new Set())}
                  className="button"
                  style={{ backgroundColor: '#dc2626', color: '#fff' }}
                >
                  ✕ {t.deselectAll}
                </button>
              </>
            )}
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
                    <th style={{
                      padding: '0.5rem 0.5rem',
                      textAlign: 'center',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      width: '40px'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.size === paginatedData.length && paginatedData.length > 0}
                        onChange={toggleSelectAll}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    {[...activeColumns].map(cid => {
                      const col = columnDefs.find(c => c.id === cid);
                      return col ? (
                        <th
                          key={cid}
                          onClick={() => col.sortable && handleSort(cid as SortField)}
                          style={{
                            padding: '0.5rem 1rem',
                            textAlign: 'left',
                            borderBottom: '1px solid var(--color-gray-400)',
                            backgroundColor: 'var(--color-gray-700)',
                            color: 'var(--color-gray-200)',
                            fontWeight: 600,
                            cursor: col.sortable ? 'pointer' : 'default',
                            userSelect: 'none'
                          }}
                        >
                          {col.label}
                          {col.sortable && sortField === cid && (
                            <span style={{ marginLeft: '0.25rem' }}>
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                      ) : null;
                    })}
                    <th style={{
                      padding: '0.5rem 1rem',
                      textAlign: 'center',
                      borderBottom: '1px solid var(--color-gray-400)',
                      backgroundColor: 'var(--color-gray-700)',
                      color: 'var(--color-gray-200)',
                      fontWeight: 600,
                      width: '100px'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(r => (
                    <tr key={r.id} style={{
                      backgroundColor: selectedRegistrations.has(r.id) ? '#1a2a3a' : 'transparent'
                    }}>
                      <td style={{
                        padding: '0.5rem 0.5rem',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
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
                      <td style={{
                        padding: '0.5rem 1rem',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--color-gray-400)'
                      }}>
                        <button
                          onClick={() => openDetailModal(r)}
                          className="button"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#3b82f6',
                            color: '#fff'
                          }}
                        >
                          👁 {t.viewDetails}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Pagination Section */}
        <section>
          <div style={{
            margin: "1rem 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ fontSize: "0.75rem", opacity: "0.75" }}>
              {sortedAndFiltered.length} {t.total} {selectedRegistrations.size > 0 && `• ${selectedRegistrations.size} ${t.selected}`}
            </div>
            {totalPages > 1 && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="button"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.25rem 0.5rem",
                    opacity: page === 1 ? 0.5 : 1,
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ←
                </button>
                <span style={{ fontSize: "0.75rem" }}>
                  {t.page} {page} {t.of} {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="button"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.25rem 0.5rem",
                    opacity: page === totalPages ? 0.5 : 1,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  →
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  style={{
                    background: "#111",
                    border: "1px solid #333",
                    color: "#eee",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "0.7rem",
                    marginLeft: "0.5rem"
                  }}
                >
                  <option value="25">25 {t.perPage}</option>
                  <option value="50">50 {t.perPage}</option>
                  <option value="100">100 {t.perPage}</option>
                  <option value="200">200 {t.perPage}</option>
                </select>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div
          onClick={closeDetailModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '1.5rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #333'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t.registrationDetails}</h2>
              <button
                onClick={closeDetailModal}
                className="button"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.75rem'
                }}
              >
                ✕ {t.close}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedRegistration.id}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Email</div>
                <div style={{ fontSize: '0.9rem' }}>{selectedRegistration.email}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Status</div>
                <span style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  display: 'inline-block',
                  backgroundColor: selectedRegistration.status === 'confirmed' ? '#d4edda' :
                    selectedRegistration.status === 'pending' ? '#fff3cd' : '#f8d7da',
                  color: selectedRegistration.status === 'confirmed' ? '#155724' :
                    selectedRegistration.status === 'pending' ? '#856404' : '#721c24'
                }}>
                  {selectedRegistration.status}
                </span>
              </div>

              {selectedRegistration.event && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Event</div>
                  <div style={{ fontSize: '0.9rem' }}>{selectedRegistration.event.name}</div>
                  {selectedRegistration.event.startDate && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                      {new Date(selectedRegistration.event.startDate).toLocaleString()} - {new Date(selectedRegistration.event.endDate).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {selectedRegistration.ticket && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Ticket</div>
                  <div style={{ fontSize: '0.9rem' }}>{selectedRegistration.ticket.name}</div>
                  {selectedRegistration.ticket.price !== undefined && (
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                      Price: ${selectedRegistration.ticket.price}
                    </div>
                  )}
                </div>
              )}

              {selectedRegistration.referredBy && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>{t.referredBy}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedRegistration.referredBy}</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Created At</div>
                <div style={{ fontSize: '0.9rem' }}>{new Date(selectedRegistration.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>Updated At</div>
                <div style={{ fontSize: '0.9rem' }}>{new Date(selectedRegistration.updatedAt).toLocaleString()}</div>
              </div>

              {selectedRegistration.formData && Object.keys(selectedRegistration.formData).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.5rem' }}>{t.formData}</div>
                  <div style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    padding: '0.75rem',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    {Object.entries(selectedRegistration.formData).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '0.5rem' }}>
                        <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{key}:</span>{' '}
                        <span style={{ color: '#eee' }}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
