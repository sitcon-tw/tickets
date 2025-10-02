"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import * as i18n from "@/i18n";

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
        },
        studentTicket: {
          "zh-Hant": "學生票",
          "zh-Hans": "学生票",
          en: "Student Ticket"
        },
        studentTicketDesc: {
          "zh-Hant": "學生保留名額。報到時請攜帶學生證或相關身分證件，以利年會工作人員查驗。",
          "zh-Hans": "学生保留名额。报到时请携带学生证或相关身份证件，以利年会工作人员查验。",
          en: "Reserved for students. Please bring your student ID or relevant identification for verification at check-in."
        },
        generalTicket: {
          "zh-Hant": "一般票",
          "zh-Hans": "一般票",
          en: "General Ticket"
        },
        generalTicketDesc: {
          "zh-Hant": "一般票提供給所有對活動有興趣的夥伴。",
          "zh-Hans": "一般票提供给所有对活动有兴趣的伙伴。",
          en: "General tickets are available for all participants interested in the event."
        },
        remoteTicket: {
          "zh-Hant": "遠道而來票",
          "zh-Hans": "远道而来票",
          en: "Remote Attendee Ticket"
        },
        remoteTicketDesc: {
          "zh-Hant": "若您自外縣市前來，可申請遠道而來票以獲得更多協助。",
          "zh-Hans": "若您自外县市前来，可申请远道而来票以获得更多协助。",
          en: "If you're traveling from outside the local area, you may apply for this ticket to receive additional assistance."
        },
        invitationTicket: {
          "zh-Hant": "邀請票",
          "zh-Hans": "邀请票",
          en: "Invitation Ticket"
        },
        invitationTicketDesc: {
          "zh-Hant": "邀請票提供給特別邀請的講者與合作夥伴。",
          "zh-Hans": "邀请票提供给特别邀请的讲者与合作伙伴。",
          en: "Invitation tickets are provided to specially invited speakers and partners."
        },
        contributorTicket: {
          "zh-Hant": "開源貢獻票",
          "zh-Hans": "开源贡献票",
          en: "Open Source Contributor Ticket"
        },
        contributorTicketDesc: {
          "zh-Hant": "感謝在開源社群有貢獻的朋友，您可憑紀錄申請此票種。",
          "zh-Hans": "感谢在开源社群有贡献的朋友，您可凭记录申请此票种。",
          en: "Thank you for your contributions to the open source community. You may apply for this ticket with your contribution records."
        }
      }),
    [lang]
  );

  const ticketDetails = [
    { name: t.studentTicket, description: t.studentTicketDesc },
    { name: t.generalTicket, description: t.generalTicketDesc },
    { name: t.remoteTicket, description: t.remoteTicketDesc },
    { name: t.invitationTicket, description: t.invitationTicketDesc },
    { name: t.contributorTicket, description: t.contributorTicketDesc }
  ];

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
        {ticketDetails.map((ticket, index) => (
          <section
            key={ticket.name}
            style={index > 0 ? { marginTop: '1.5rem' } : undefined}
          >
            <h3>{ticket.name}</h3>
            <p>{ticket.description}</p>
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
