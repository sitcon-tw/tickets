"use client";

import React, { useEffect, useState } from 'react';
import { routing } from '@/i18n/routing';
import { getTranslations } from "@/i18n/helpers";
import Link from 'next/link';

export default function NotFound() {
  const [locale, setLocale] = useState(routing.defaultLocale);

  useEffect(() => {
    const path = window.location.pathname;
    const detectedLocale = routing.locales.find(loc => path.startsWith(`/${loc}`));
    if (detectedLocale) {
      setLocale(detectedLocale);
    }
  }, []);

  const t = getTranslations(locale, {
    title: {
      "zh-Hant": "找不到頁面",
      "zh-Hans": "找不到页面",
      en: "Page Not Found"
    },
    description: {
      "zh-Hant": "抱歉，您訪問的頁面不存在。",
      "zh-Hans": "抱歉，您访问的页面不存在。",
      en: "Sorry, the page you are looking for does not exist."
    },
    backHome: {
      "zh-Hant": "回首頁",
      "zh-Hans": "回首页",
      en: "Back to Home"
    }
  });

  return (
    <>
      <main style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}>
        <section>
          <h1 style={{ marginBlock: "1rem" }} className="text-2xl font-bold">{t.title}</h1>
          <p>{t.description}</p>
          <Link style={{ margin: "1rem auto" }} className="button" href={`/${locale}/`}>{t.backHome}</Link>
        </section>
      </main>
    </>
  );
};
