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

  const t = getTranslations(locale, {
    title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
    ticketLabel: { "zh-Hant": "票種", "zh-Hans": "票种", en: "Ticket" },
    backToTickets: { "zh-Hant": "返回票種列表", "zh-Hans": "返回票种列表", en: "Back to Tickets" },
    noTicket: { "zh-Hant": "未指定票種", "zh-Hans": "未指定票种", en: "No ticket specified" },
    addQuestion: { "zh-Hant": "新增問題", "zh-Hans": "新增问题", en: "Add Question" },
    save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save Form" }
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

  // Load form fields from backend
  const loadFormFields = useCallback(async () => {
    if (!currentTicket?.id) return;

    setIsLoading(true);

    try {
      const response = await adminTicketFormFieldsAPI.getAll({ ticketId: currentTicket.id });

      if (response.success) {
        setQuestions((response.data || []).map((field: TicketFormField) => {
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
        }));
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
    }
  }, [currentTicket?.id, loadFormFields]);

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
          <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
            {t.noTicket}
          </p>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button
              className="button"
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
            className="button"
            onClick={() => window.location.href = `/${locale}/admin/tickets`}
            style={{ marginBottom: '1rem' }}
          >
            ← {t.backToTickets}
          </button>
          <h1>{t.title}</h1>
          {currentTicket && (
            <div style={{
              padding: '1rem',
              background: 'var(--color-gray-800)',
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              <strong>{t.ticketLabel}:</strong> {currentTicket.name}
              {currentTicket.description && (
                <div style={{ marginTop: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>
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
          <div id="questions" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: '1rem 0'
          }}>
            {questions.length === 0 && (
              <div style={{
                opacity: 0.6,
                fontStyle: 'italic',
                padding: '1rem',
                textAlign: 'center',
                border: '1px dashed #444',
                borderRadius: '8px'
              }}>尚無問題</div>
            )}
            {questions.map((q, index) => (
              <div key={q.id} data-id={q.id} style={{
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                gap: '12px',
                alignItems: 'start',
                position: 'relative'
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
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#bbb'
                    }}>問題</label>
                    <input
                      type="text"
                      value={q.label}
                      placeholder="問題標籤"
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                      style={{
                        background: '#111',
                        border: '1px solid #333',
                        color: '#eee',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.8rem',
                        minWidth: '160px'
                      }}
                    />
                    <label style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#bbb'
                    }}>種類</label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                      style={{
                        width: '140px',
                        background: '#111',
                        border: '1px solid #333',
                        color: '#eee',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.8rem'
                      }}
                    >
                      {["text", "email", "phone", "textarea", "select", "radio", "checkbox"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => updateQuestion(q.id, { required: !q.required })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.65rem',
                        background: q.required ? '#303030' : '#222',
                        border: `1px solid ${q.required ? '#666' : '#444'}`,
                        color: q.required ? '#fff' : 'inherit',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      {q.required ? "必填" : "選填"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(q.id)}
                      style={{
                        background: '#2a0000',
                        border: '1px solid #550000',
                        color: '#ff8d8d',
                        fontSize: '0.65rem',
                        padding: '4px 8px',
                        borderRadius: '4px'
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
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#bbb'
                    }}>說明</label>
                    <input
                      type="text"
                      value={q.help || ''}
                      placeholder="說明文字 (選填)"
                      onChange={(e) => updateQuestion(q.id, { help: e.target.value })}
                      style={{
                        background: '#111',
                        border: '1px solid #333',
                        color: '#eee',
                        borderRadius: '6px',
                        padding: '6px 8px',
                        fontSize: '0.8rem',
                        minWidth: '160px'
                      }}
                    />
                  </div>
                  {["select", "radio", "checkbox"].includes(q.type) && (
                    <div>
                      <div style={{
                        marginTop: '4px',
                        padding: '6px 8px',
                        border: '1px dashed #444',
                        borderRadius: '6px',
                        background: '#161616',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {(q.options || []).map((opt, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            gap: '6px',
                            alignItems: 'center'
                          }}>
                            <span style={{ cursor: 'grab' }} title="Drag option">⋮⋮</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(q.options || [])];
                                newOptions[i] = e.target.value;
                                updateQuestion(q.id, { options: newOptions });
                              }}
                              style={{ flex: 1 }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...(q.options || [])];
                                newOptions.splice(i, 1);
                                updateQuestion(q.id, { options: newOptions });
                              }}
                              style={{
                                background: '#222',
                                border: '1px solid #444',
                                color: '#bbb',
                                fontSize: '0.65rem',
                                padding: '4px 6px',
                                borderRadius: '4px'
                              }}
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
                          style={{
                            background: '#222',
                            border: '1px solid #444',
                            color: '#bbb',
                            fontSize: '0.65rem',
                            padding: '4px 8px',
                            borderRadius: '4px',
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
            gap: '12px'
          }}>
            <button id="add-question" type="button" onClick={addQuestion} style={{
              background: '#1f1f1f',
              border: '1px solid #444',
              color: '#eee',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}>
              + {t.addQuestion}
            </button>
            <button id="save-form" type="button" onClick={saveForm} style={{
              background: '#155e29',
              border: '1px solid #1d7b34',
              color: '#eee',
              borderRadius: '6px',
              padding: '8px 14px',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}>
              💾 {t.save}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
