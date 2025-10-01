"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
import { formFields as formFieldsAPI, events as eventsAPI, tickets as ticketsAPI, initializeAdminPage } from "@/lib/admin";

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
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const t = i18n.t(lang, {
    title: { "zh-Hant": "編輯表單", "zh-Hans": "编辑表单", en: "Edit Form" },
    addQuestion: { "zh-Hant": "新增問題", "zh-Hans": "新增问题", en: "Add Question" },
    save: { "zh-Hant": "儲存表單", "zh-Hans": "保存表单", en: "Save Form" }
  });

  // Load event and ticket data
  const loadEventAndTicket = useCallback(async () => {
    try {
      const eventsResponse = await eventsAPI.list();
      if (eventsResponse.success && eventsResponse.data && eventsResponse.data.length > 0) {
        setCurrentEventId(eventsResponse.data[0].id);

        const ticketsResponse = await ticketsAPI.list(eventsResponse.data[0].id);
        if (ticketsResponse.success && ticketsResponse.data && ticketsResponse.data.length > 0) {
          setCurrentTicketId(ticketsResponse.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load event and ticket:', error);
      throw error;
    }
  }, []);

  // Load form fields from backend
  const loadFormFields = useCallback(async () => {
    if (isLoading || !currentTicketId) return;

    setIsLoading(true);

    try {
      const response = await formFieldsAPI.list(currentTicketId);

      if (response.success) {
        setQuestions((response.data || []).map((field: any) => ({
          id: field.id,
          label: field.description || field.name,
          type: field.type,
          required: field.required || false,
          help: field.helpText || '',
          options: field.values ? JSON.parse(field.values) : undefined
        })));
      } else {
        throw new Error(response.message || 'Failed to load form fields');
      }
    } catch (error) {
      console.error('Failed to load form fields:', error);
      loadDemoData();
    } finally {
      setIsLoading(false);
    }
  }, [currentTicketId, isLoading]);

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
    if (!currentTicketId) {
      alert('無法保存：未找到票種');
      return;
    }

    try {
      const formFieldsData = questions.map((q, index) => ({
        id: q.id.startsWith('temp-') ? undefined : q.id,
        name: q.label.toLowerCase().replace(/\s+/g, '_'),
        description: q.label,
        type: q.type,
        required: q.required,
        helpText: q.help,
        values: q.options ? JSON.stringify(q.options) : null,
        order: index
      }));

      for (const fieldData of formFieldsData) {
        const data = { ...fieldData, ticketId: currentTicketId };

        if (fieldData.id) {
          await formFieldsAPI.update(fieldData.id, data);
        } else {
          await formFieldsAPI.create(data);
        }
      }

      alert('表單已保存！');
    } catch (error: any) {
      console.error('Failed to save form:', error);
      alert('保存失敗: ' + error.message);
    }
  };

  // Initialize page
  useEffect(() => {
    const init = async () => {
      const isAuthorized = await initializeAdminPage();
      if (!isAuthorized) return;

      await loadEventAndTicket();
    };

    init();
  }, [loadEventAndTicket]);

  useEffect(() => {
    if (currentTicketId) {
      loadFormFields();
    } else {
      loadDemoData();
    }
  }, [currentTicketId, loadFormFields]);

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

  return (
    <>
      <AdminNav />
      <main>
        <h1>{t.title}</h1>
        <div id="form-editor" className="editor">
          <div id="questions" className="questions">
            {questions.length === 0 && (
              <div className="empty">尚無問題</div>
            )}
            {questions.map((q, index) => (
              <div key={q.id} className="question" data-id={q.id}>
                <div className="handle" title="Drag to reorder">☰</div>
                <div className="q-body">
                  <div className="q-row">
                    <label>問題</label>
                    <input
                      type="text"
                      value={q.label}
                      placeholder="問題標籤"
                      onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                    />
                    <label>種類</label>
                    <select
                      className="type-select"
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value })}
                    >
                      {["text", "email", "phone", "textarea", "select", "radio", "checkbox"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="required-toggle"
                      data-on={q.required ? "true" : "false"}
                      onClick={() => updateQuestion(q.id, { required: !q.required })}
                    >
                      {q.required ? "必填" : "選填"}
                    </button>
                    <button
                      type="button"
                      className="delete-question"
                      onClick={() => deleteQuestion(q.id)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="q-row">
                    <label>說明</label>
                    <input
                      type="text"
                      value={q.help || ''}
                      placeholder="說明文字 (選填)"
                      onChange={(e) => updateQuestion(q.id, { help: e.target.value })}
                    />
                  </div>
                  {["select", "radio", "checkbox"].includes(q.type) && (
                    <div className="options-wrapper">
                      <div className="options">
                        {(q.options || []).map((opt, i) => (
                          <div key={i} className="option-item">
                            <span style={{ cursor: 'grab' }} title="Drag option">⋮⋮</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...(q.options || [])];
                                newOptions[i] = e.target.value;
                                updateQuestion(q.id, { options: newOptions });
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = [...(q.options || [])];
                                newOptions.splice(i, 1);
                                updateQuestion(q.id, { options: newOptions });
                              }}
                            >
                              刪除
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="add-option"
                          onClick={() => {
                            const newOptions = [...(q.options || []), ""];
                            updateQuestion(q.id, { options: newOptions });
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
          <div className="toolbar">
            <button id="add-question" type="button" onClick={addQuestion}>
              + {t.addQuestion}
            </button>
            <button id="save-form" type="button" className="primary" onClick={saveForm}>
              💾 {t.save}
            </button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .editor {
          max-width: 960px;
          margin: 1rem auto 4rem;
        }
        .questions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 1rem 0;
        }
        .question {
          background: #1e1e1e;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px 14px;
          display: grid;
          grid-template-columns: 32px 1fr auto;
          gap: 12px;
          align-items: start;
          position: relative;
        }
        .handle {
          cursor: grab;
          user-select: none;
          font-size: 1.1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
        }
        .q-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .q-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .q-row label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #bbb;
        }
        .q-row input[type="text"],
        .q-row select,
        .q-row textarea {
          background: #111;
          border: 1px solid #333;
          color: #eee;
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 0.8rem;
          min-width: 160px;
        }
        .type-select {
          width: 140px;
        }
        .options {
          margin-top: 4px;
          padding: 6px 8px;
          border: 1px dashed #444;
          border-radius: 6px;
          background: #161616;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .option-item {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .option-item input {
          flex: 1;
        }
        .option-item button {
          background: #222;
          border: 1px solid #444;
          color: #bbb;
          font-size: 0.65rem;
          padding: 4px 6px;
          border-radius: 4px;
        }
        .add-option {
          background: #222;
          border: 1px solid #444;
          color: #bbb;
          font-size: 0.65rem;
          padding: 4px 8px;
          border-radius: 4px;
          align-self: flex-start;
        }
        .delete-question {
          background: #2a0000;
          border: 1px solid #550000;
          color: #ff8d8d;
          font-size: 0.65rem;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .required-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          background: #222;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
        }
        .required-toggle[data-on="true"] {
          color: #fff;
          border-color: #666;
          background: #303030;
        }
        .toolbar {
          display: flex;
          gap: 12px;
        }
        .toolbar button {
          background: #1f1f1f;
          border: 1px solid #444;
          color: #eee;
          border-radius: 6px;
          padding: 8px 14px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .toolbar button.primary {
          background: #155e29;
          border-color: #1d7b34;
        }
        .empty {
          opacity: 0.6;
          font-style: italic;
          padding: 1rem;
          text-align: center;
          border: 1px dashed #444;
          border-radius: 8px;
        }
      `}</style>
    </>
  );
}
