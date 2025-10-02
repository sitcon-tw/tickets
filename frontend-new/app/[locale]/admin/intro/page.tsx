"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from "@/components/AdminNav";
import * as i18n from "@/i18n";
import { initializeAdminPage } from "@/lib/admin";

export default function IntroPage() {
  const pathname = usePathname();
  const lang = i18n.local(pathname);

  const t = i18n.t(lang, {
    title: { "zh-Hant": "編輯說明", "zh-Hans": "编辑说明", en: "Edit Instructions" },
    paragraph1: {
      "zh-Hant": "若要編輯首頁的說明，以及票種的說明，請直接編輯",
      "zh-Hans": "若要编辑首页的说明，以及票种的说明，请直接编辑",
      en: "To edit the instructions on the homepage and ticket types, please directly edit "
    },
    paragraph2: {
      "zh-Hant": "GitHub Markdown 資料夾裡面的檔案。",
      "zh-Hans": "GitHub Markdown 资料夹里面的档案。",
      en: "the files in the GitHub Markdown folder."
    },
    current: {
      "zh-Hant": "以下為目前有的文件：",
      "zh-Hans": "以下为目前有的文件：",
      en: "The following are the current documents:"
    }
  });

  useEffect(() => {
    const init = async () => {
      await initializeAdminPage();
    };
    init();

    // Generate GitHub links
    const items = ["intro", "faq", "terms"];
    const tickets = ["學生票", "普通票", "遠道而來票", "邀請票", "開源貢獻票"];
    const allItems = items.concat(tickets.map(ticket => `tickets/${ticket}`));
    const languages = i18n.localesList();
    const ul = document.querySelector(".github-list");

    if (ul) {
      allItems.forEach(item => {
        const li = document.createElement("li");
        li.innerText = `${item}：`;
        languages.forEach((locale, idx) => {
          const a = document.createElement("a");
          const fileName = locale === "zh-Hant" ? `${item}.md` : `${item}.${locale}.md`;
          a.href = `https://github.com/sitcon-tw/2026-tickets/edit/dev/frontend/src/pages/markdown/${fileName}`;
          a.textContent = locale;
          a.target = "_blank";
          li.appendChild(a);
          if (idx < languages.length - 1) {
            li.innerHTML += " / ";
          }
        });
        ul.appendChild(li);
      });
    }
  }, []);

  return (
    <>
      <AdminNav />
      <main style={{ paddingTop: "5rem" }}>
        <h1>{t.title}</h1>
        <p>
          {t.paragraph1}{" "}
          <a href="https://github.com/sitcon-tw/2026-tickets/tree/dev/frontend/src/pages/markdown" target="_blank">
            {t.paragraph2}
          </a>
        </p>
        <p>{t.current}</p>
        <ul
          className="github-list"
          style={{
            listStyle: "none",
            padding: "0",
            margin: "1rem 0"
          }}
        ></ul>
      </main>

      <style jsx>{`
        .github-list li {
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }
        .github-list a {
          color: #60a5fa;
          text-decoration: none;
        }
        .github-list a:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
