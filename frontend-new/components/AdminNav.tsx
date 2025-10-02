"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as i18n from "@/i18n";

const activityLinks = [
  { href: "/admin/", i18nKey: "overview" },
  { href: "/admin/tickets/", i18nKey: "ticketTypes" },
  { href: "/admin/forms/", i18nKey: "forms" },
  { href: "/admin/invites/", i18nKey: "invitationCodes" },
  { href: "/admin/registrations/", i18nKey: "registrations" },
  { href: "/admin/intro/", i18nKey: "editIntro" }
 ] as const;

const styles = {
  aside: {
    backgroundColor: "var(--color-gray-950)",
    padding: "2rem",
    width: "17rem",
    height: "100dvh",
    position: "fixed" as const,
    display: "flex",
    flexDirection: "column" as const,
    fontSize: "1.2rem"
  },
  activity: {
    fontSize: "1.2rem"
  },
  title: {
    fontSize: "2rem",
    marginTop: "0.5rem"
  },
  nav: {
    marginTop: "2rem",
    flex: 1
  },
  navList: {
    paddingLeft: "0.8rem",
    margin: 0
  },
  navItem: {
    listStyle: "none",
    marginBottom: "1rem"
  },
  links: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.8rem"
  },
  user: {
    fontWeight: 600
  },
  logout: {
    display: "flex",
    gap: "0.5rem"
  }
};

export default function AdminNav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const lang = i18n.local(currentPath);

  const linkBuilder = useMemo(() => i18n.l(currentPath), [currentPath]);

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  useEffect(() => {
    // Inject global styles for main element
    const styleId = 'admin-nav-global-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        main {
          padding-top: 5rem;
          max-width: unset;
          margin-left: 17rem;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const style = document.getElementById(styleId);
      if (style) {
        style.remove();
      }
    };
  }, []);

  const t = useMemo(
    () =>
      i18n.t(lang, {
        activityName: {
          "zh-Hant": "SITCON 2026",
          "zh-Hans": "SITCON 2026",
          en: "SITCON 2026"
        },
        systemTitle: {
          "zh-Hant": "報名系統後台",
          "zh-Hans": "报名系统后台",
          en: "Admin Panel"
        },
        overview: {
          "zh-Hant": "總覽",
          "zh-Hans": "总览",
          en: "Overview"
        },
        ticketTypes: {
          "zh-Hant": "票種管理",
          "zh-Hans": "票种管理",
          en: "Ticket Types"
        },
        forms: {
          "zh-Hant": "表單管理",
          "zh-Hans": "表单管理",
          en: "Forms"
        },
        invitationCodes: {
          "zh-Hant": "邀請碼管理",
          "zh-Hans": "邀请码管理",
          en: "Invitation Codes"
        },
        registrations: {
          "zh-Hant": "報名資料",
          "zh-Hans": "报名资料",
          en: "Registrations"
        },
        editIntro: {
          "zh-Hant": "編輯說明",
          "zh-Hans": "编辑说明",
          en: "Edit Intro"
        },
        userPlaceholder: {
          "zh-Hant": "管理者",
          "zh-Hans": "管理员",
          en: "Admin"
        },
        logout: {
          "zh-Hant": "登出",
          "zh-Hans": "登出",
          en: "Logout"
        },
        backHome: {
          "zh-Hant": "回到首頁",
          "zh-Hans": "回到首页",
          en: "Back to Home"
        }
      }),
    [lang]
  );

  return (
    <aside style={styles.aside}>
      <div style={styles.activity}>{t.activityName}</div>
      <div style={styles.title}>{t.systemTitle}</div>
      <nav style={styles.nav}>
        <ul style={styles.navList}>
          {activityLinks.map(({ href, i18nKey }) => (
            <li key={href} style={styles.navItem}>
              <a
                href={linkBuilder(href)}
                onMouseEnter={() => setHoveredLink(href)}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  textDecoration: hoveredLink === href ? 'underline' : 'none'
                }}
              >
                {t[i18nKey]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div style={styles.links}>
        <div style={styles.user}>{t.userPlaceholder}</div>
        <div style={styles.logout}>
          <a
            href={linkBuilder("/admin/logout")}
            onMouseEnter={() => setHoveredLink('logout')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              textDecoration: hoveredLink === 'logout' ? 'underline' : 'none'
            }}
          >
            {t.logout}
          </a>
          <span>・</span>
          <a
            href="/"
            onMouseEnter={() => setHoveredLink('home')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              textDecoration: hoveredLink === 'home' ? 'underline' : 'none'
            }}
          >
            {t.backHome}
          </a>
        </div>
        <div style={styles.logout}>
          <a
            href={linkBuilder("", "zh-Hant")}
            onMouseEnter={() => setHoveredLink('zh-Hant')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              textDecoration: hoveredLink === 'zh-Hant' ? 'underline' : 'none'
            }}
          >
            繁
          </a>
          <span>・</span>
          <a
            href={linkBuilder("", "zh-Hans")}
            onMouseEnter={() => setHoveredLink('zh-Hans')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              textDecoration: hoveredLink === 'zh-Hans' ? 'underline' : 'none'
            }}
          >
            簡
          </a>
          <span>・</span>
          <a
            href={linkBuilder("", "en")}
            onMouseEnter={() => setHoveredLink('en')}
            onMouseLeave={() => setHoveredLink(null)}
            style={{
              textDecoration: hoveredLink === 'en' ? 'underline' : 'none'
            }}
          >
            EN
          </a>
        </div>
      </div>
    </aside>
  );
}
