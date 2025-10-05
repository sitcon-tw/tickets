"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import { getTranslations } from "@/i18n/helpers";
import { adminTicketFormFieldsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import type { TicketFormField, Ticket } from "@/lib/types/api";

type ShowIf = {
  sourceId: string;
  values: string[];
};

type Question = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  help?: string;
  options?: string[];
  showIf?: ShowIf;
};

export default function FormsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [copyFromTicketId, setCopyFromTicketId] = useState<string>('');
  const [originalFieldIds, setOriginalFieldIds] = useState<string[]>([]);

  const t = getTranslations(locale, {
    title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
    ticketLabel: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
    backToTickets: { "zh-Hant": "返回票種列表", "zh-Hans": "返回票种列表", en: "Back to Tickets" },
    noTicket: { "zh-Hant": "未指定票種", "zh-Hans": "未指定票种", en: "No ticket specified" },
    addQuestion: { "zh-Hant": "新增問題", "zh-Hans": "新增问题", en: "Add Question" },
    save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save Form" },
    copyFrom: { "zh-Hant": "複製其他票種表單", "zh-Hans": "复制其他票种表单", en: "Copy from other ticket" },
    selectTicket: { "zh-Hant": "選擇票種...", "zh-Hans": "选择票种...", en: "Select ticket..." },
    copySuccess: { "zh-Hant": "已成功複製表單！", "zh-Hans": "已成功复制表单！", en: "Form copied successfully!" }
  });

  // Load ticket data from URL param
  const loadTicket = useCallback(async () => {
    const ticketId = searchParams.get('ticket');

    if (!ticketId) {
      console.error('No ticket ID provided');
      return;
    }

    try {
      const response = await adminTicketsAPI.getById(ticketId);
      if (response.success && response.data) {
        setCurrentTicket(response.data);
      }
    } catch (error) {
      console.error('Failed to load ticket:', error);
    }
  }, [searchParams]);

  // Load all tickets for the copy dropdown
  const loadAllTickets = useCallback(async () => {
    if (!currentTicket?.eventId) return;

    try {
      const response = await adminTicketsAPI.getAll({ eventId: currentTicket.eventId });
      if (response.success) {
        // Filter out the current ticket from the list
        setAllTickets((response.data || []).filter(t => t.id !== currentTicket.id));
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  }, [currentTicket?.eventId, currentTicket?.id]);

  // Load form fields from backend
  const loadFormFields = useCallback(async () => {
    if (!currentTicket?.id) return;

    setIsLoading(true);

    try {
      const response = await adminTicketFormFieldsAPI.getAll({ ticketId: currentTicket.id });

      if (response.success) {
        const loadedFields = (response.data || []).map((field: TicketFormField) => {
          let options: string[] | undefined = undefined;

          // Try to parse values as JSON array
          if (field.values) {
            try {
              const parsed = JSON.parse(field.values);
              if (Array.isArray(parsed)) {
                options = parsed;
              }
            } catch (e) {
              // If parsing fails, treat it as a single value or ignore
              console.warn('Failed to parse field values as JSON:', field.values);
            }
          }

          return {
            id: field.id,
            label: field.description || field.name,
            type: field.type,
            required: field.required || false,
            help: field.helpText || '',
            options
          };
        });

        setQuestions(loadedFields);
        // Track original field IDs to detect deletions
        setOriginalFieldIds(loadedFields.map((f: Question) => f.id).filter((id: string) => !id.startsWith('temp-')));
      } else {
        throw new Error(response.message || 'Failed to load form fields');
      }
    } catch (error) {
      console.error('Failed to load form fields:', error);
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }, [currentTicket?.id]);

  // Load demo data (fallback)
  const loadDemoData = () => {
    setQuestions([
      { id: crypto.randomUUID(), label: "全名", type: "text", required: true, help: "請輸入您的真實姓名。" },
      { id: crypto.randomUUID(), label: "電子郵件", type: "email", required: true, help: "請輸入您的電子郵件地址。" },
      { id: crypto.randomUUID(), label: "電話號碼", type: "phone", required: false, help: "請輸入您的電話號碼。" },
      { id: crypto.randomUUID(), label: "T恤尺寸", type: "select", required: true, options: ["XS", "S", "M", "L", "XL"], help: "請選擇您的T恤尺寸。" },
      { id: crypto.randomUUID(), label: "飲食偏好", type: "radio", required: false, options: ["無", "素", "清蒸", "蛋奶素"], help: "請選擇您的飲食偏好。" },
      { id: crypto.randomUUID(), label: "技能", type: "checkbox", required: false, options: ["Frontend", "Backend", "Design", "DevOps"], help: "請選擇您的技能。" },
      { id: crypto.randomUUID(), label: "關於你", type: "textarea", required: false, help: "請簡要介紹自己。" }
    ]);
  };

  // Copy form from another ticket
  const copyFormFromTicket = async (sourceTicketId: string) => {
    if (!sourceTicketId) return;

    try {
      const response = await adminTicketFormFieldsAPI.getAll({ ticketId: sourceTicketId });

      if (response.success && response.data) {
        const copiedQuestions = response.data.map((field: TicketFormField) => {
          let options: string[] | undefined = undefined;

          if (field.values) {
            try {
              const parsed = JSON.parse(field.values);
              if (Array.isArray(parsed)) {
                options = parsed;
              }
            } catch (e) {
              console.warn('Failed to parse field values as JSON:', field.values);
            }
          }

          return {
            id: 'temp-' + crypto.randomUUID(),
            label: field.description || field.name,
            type: field.type,
            required: field.required || false,
            help: field.helpText || '',
            options
          };
        });

        setQuestions(copiedQuestions);
        setCopyFromTicketId('');
        alert(t.copySuccess);
      }
    } catch (error) {
      console.error('Failed to copy form:', error);
      alert('複製失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Save form to backend
  const saveForm = async () => {
    if (!currentTicket?.id) {
      alert('無法保存：未找到票種');
      return;
    }

    try {
      const formFieldsData = questions.map((q, index) => ({
        id: q.id.startsWith('temp-') ? undefined : q.id,
        name: q.label.toLowerCase().replace(/\s+/g, '_'),
        description: q.label,
        type: q.type as 'text' | 'textarea' | 'select' | 'checkbox' | 'radio',
        required: q.required,
        helpText: q.help,
        values: q.options ? JSON.stringify(q.options) : undefined,
        order: index
      }));

      // Find fields that were deleted (in originalFieldIds but not in current questions)
      const currentFieldIds = questions
        .map(q => q.id)
        .filter(id => !id.startsWith('temp-'));

      const deletedFieldIds = originalFieldIds.filter(
        originalId => !currentFieldIds.includes(originalId)
      );

      // Delete removed fields
      for (const fieldId of deletedFieldIds) {
        await adminTicketFormFieldsAPI.delete(fieldId);
      }

      // Create or update existing fields
      for (const fieldData of formFieldsData) {
        const data = {
          ticketId: currentTicket.id,
          order: fieldData.order,
          type: fieldData.type,
          name: fieldData.name,
          description: fieldData.description,
          placeholder: '',
          required: fieldData.required,
          validater: '',
          values: fieldData.values,
        };

        if (fieldData.id) {
          await adminTicketFormFieldsAPI.update(fieldData.id, data);
        } else {
          await adminTicketFormFieldsAPI.create(data);
        }
      }

      // Reload the form to get fresh data and update originalFieldIds
      await loadFormFields();

      alert('表單已保存！');
    } catch (error) {
      console.error('Failed to save form:', error);
      alert('保存失敗: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Initialize page
  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  useEffect(() => {
    if (currentTicket?.id) {
      loadFormFields();
      loadAllTickets();
    }
  }, [currentTicket?.id, loadFormFields, loadAllTickets]);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: 'temp-' + crypto.randomUUID(),
      label: "新問題",
      type: "text",
      required: false
    }]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, movedQuestion);
    setQuestions(newQuestions);
  };

  if (!searchParams.get('ticket')) {
    return (
      <>
        <AdminNav />
        <main>
          <h1>{t.title}</h1>
          <div className="admin-empty" style={{ padding: '4rem 2rem' }}>
            {t.noTicket}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              className="admin-button primary"
              onClick={() => window.location.href = `/${locale}/admin/tickets`}
            >
              {t.backToTickets}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminNav />
      <main>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            className="admin-button secondary"
            onClick={() => window.location.href = `/${locale}/admin/tickets`}
            style={{ marginBottom: '1rem' }}
          >
            ← {t.backToTickets}
          </button>
          <h1>{t.title}</h1>
          {currentTicket && (
            <div className="admin-stat-card" style={{ marginTop: '1rem' }}>
              <div className="admin-stat-label">{t.ticketLabel}</div>
              <div className="admin-stat-value" style={{ fontSize: '1.5rem' }}>{currentTicket.name}</div>
              {currentTicket.description && (
                <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                  {currentTicket.description}
                </div>
              )}
            </div>
          )}
        </div>
        <div id="form-editor" style={{
          maxWidth: '960px',
          margin: '1rem auto 4rem'
        }}>
          {allTickets.length > 0 && (
            <div className="admin-form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="admin-form-label">{t.copyFrom}</label>
              <select
                value={copyFromTicketId}
                onChange={(e) => {
                  const ticketId = e.target.value;
                  if (ticketId && confirm('確定要複製該票種的表單嗎？這會取代目前的表單內容。')) {
                    copyFormFromTicket(ticketId);
                  } else {
                    setCopyFromTicketId('');
                  }
                }}
                className="admin-select"
              >
                <option value="">{t.selectTicket}</option>
                {allTickets.map(ticket => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div id="questions" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: '1rem 0'
          }}>
            {questions.length === 0 && (
              <div className="admin-empty" style={{
                fontStyle: 'italic',
                padding: '2rem',
                border: '1px dashed var(--color-gray-600)',
                borderRadius: '8px'
              }}>尚無問題</div>
            )}
            {questions.map((q, index) => (
              <div key={q.id} data-id={q.id} style={{
                background: 'var(--color-gray-800)',
                border: '1px solid var(--color-gray-700)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                gap: '12px',
                alignItems: 'start',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}>
                <div style={{
                  cursor: 'grab',
                  userSelect: 'none',
                  fontSize: '1.1rem',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }} title="Drag to reorder">☰</div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <label style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-gray-400)',
                      fontWeight: 500
                    }}>問題</label>
                    <input
                      type="text"
                      value={q.label}
                      placeholder="問題標籤"
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      className="admin-input"
                      style={{
                        fontSize: '0.85rem',
                        minWidth: '160px',
                        padding: '0.5rem 0.7rem'
                      }}
                    />
                    <label style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-gray-400)',
                      fontWeight: 500
                    }}>種類</label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                      className="admin-select"
                      style={{
                        width: '140px',
                        fontSize: '0.85rem',
                        padding: '0.5rem 0.7rem'
                      }}
                    >
                      {["text", "email", "phone", "textarea", "select", "radio", "checkbox"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { required: !q.required })}
                      className="admin-button small"
                      style={{
                        background: q.required ? 'var(--color-gray-600)' : 'var(--color-gray-800)',
                        border: `1px solid ${q.required ? 'var(--color-gray-500)' : 'var(--color-gray-700)'}`,
                        fontSize: '0.7rem',
                        padding: '0.35rem 0.7rem'
                      }}
                    >
                      {q.required ? "必填" : "選填"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      className="admin-button small danger"
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.35rem 0.7rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <label style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-gray-400)',
                      fontWeight: 500
                    }}>說明</label>
                    <input
                      type="text"
                      value={q.help || ''}
                      placeholder="說明文字 (選填)"
                      onChange={(e) => updateQuestion(q.id, { help: e.target.value })}
                      className="admin-input"
                      style={{
                        fontSize: '0.85rem',
                        minWidth: '160px',
                        padding: '0.5rem 0.7rem'
                      }}
                    />
                  </div>
                  {["select", "radio", "checkbox"].includes(q.type) && (
                    <div>
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        border: '1px dashed var(--color-gray-600)',
                        borderRadius: '8px',
                        background: 'var(--color-gray-900)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {(q.options || []).map((opt, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                          }}>
                            <span style={{ cursor: 'grab', color: 'var(--color-gray-500)' }} title="Drag option">⋮⋮</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(q.options || [])];
                                newOptions[i] = e.target.value;
                                updateQuestion(q.id, { options: newOptions });
                              }}
                              className="admin-input"
                              style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...(q.options || [])];
                                newOptions.splice(i, 1);
                                updateQuestion(q.id, { options: newOptions });
                              }}
                              className="admin-button small secondary"
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                            >
                              刪除
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...(q.options || []), ""];
                            updateQuestion(q.id, { options: newOptions });
                          }}
                          className="admin-button small secondary"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.4rem 0.7rem',
                            alignSelf: 'flex-start'
                          }}
                        >
                          + 新增選項
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1rem'
          }}>
            <button id="add-question" type="button" onClick={addQuestion} className="admin-button secondary">
              + {t.addQuestion}
            </button>
            <button id="save-form" type="button" onClick={saveForm} className="admin-button success">
              💾 {t.save}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
