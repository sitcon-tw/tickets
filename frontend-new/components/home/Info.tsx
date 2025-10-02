"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import * as i18n from "@/i18n";

const fallbackTicketDetails: Record<string, string> = {
  學生票: "學生保留名額。報到時請攜帶學生證或相關身分證件，以利年會工作人員查驗。",
  一般票: "一般票提供給所有對活動有興趣的夥伴。",
  遠道而來票: "若您自外縣市前來，可申請遠道而來票以獲得更多協助。",
  邀請票: "邀請票提供給特別邀請的講者與合作夥伴。",
  開源貢獻票: "感謝在開源社群有貢獻的朋友，您可憑紀錄申請此票種。"
};

export default function Info() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const lang = i18n.local(currentPath);

  const t = useMemo(
    () =>
      i18n.t(lang, {
        description: {
          "zh-Hant": "毛哥EM的網站起始模板，使用Astro和Fastify構建。",
          "zh-Hans": "毛哥EM的网站起始模板，使用Astro和Fastify构建。",
          en: "Elvis Mao's Website starter template using Astro and Fastify."
        },
        ticketInfo: {
          "zh-Hant": "票種資訊",
          "zh-Hans": "票种资讯",
          en: "Ticket Information"
        },
        faq: {
          "zh-Hant": "常見問題",
          "zh-Hans": "常见问题",
          en: "FAQ"
        },
        contentComingSoon: {
          "zh-Hant": "內容載入中，稍後補上。",
          "zh-Hans": "内容载入中，稍后补上。",
          en: "Content will be available soon."
        }
      }),
    [lang]
  );

  return (
    <section
      className="content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-gray-800)',
          padding: '2rem',
          borderRadius: '1rem'
        }}
      >
        <h2 style={{ marginBottom: '1.5rem' }}>{t.ticketInfo}</h2>
        {Object.entries(fallbackTicketDetails).map(([key, description], index) => (
          <section
            key={key}
            style={index > 0 ? { marginTop: '1.5rem' } : undefined}
          >
            <h3>{key}</h3>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <div
        style={{
          backgroundColor: 'var(--color-gray-800)',
          padding: '2rem',
          borderRadius: '1rem'
        }}
      >
        <h2 style={{ marginBottom: '1.5rem' }}>{t.faq}</h2>
        <p>{t.contentComingSoon}</p>
      </div>
    </section>
  );
}
