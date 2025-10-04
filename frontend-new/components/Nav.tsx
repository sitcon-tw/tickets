"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { getTranslations, buildLocalizedLink } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import Spinner from "@/components/Spinner";

type NavProps = {
  children?: ReactNode;
};

type SessionUser = {
  name?: string;
  email?: string;
  role?: string | string[];
};

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: SessionUser };

export default function Nav({ children }: NavProps) {
  const locale = useLocale();
  const linkBuilder = useMemo(() => buildLocalizedLink(locale), [locale]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const t = getTranslations(locale, {
    user: { "zh-Hant": "使用者", "zh-Hans": "用户", en: "User" },
    adminPage: { "zh-Hant": "管理員頁面", "zh-Hans": "管理员页面", en: "Admin Panel" },
    logout: { "zh-Hant": "登出", "zh-Hans": "登出", en: "Logout" },
    login: { "zh-Hant": "登入", "zh-Hans": "登录", en: "Login" }
  });

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 5);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkAuthStatus = async () => {
      try {
        const data = await authAPI.getSession();
        if (!cancelled) {
          if (data && data.user) {
            setSession({ status: "authenticated", user: data.user });
          } else {
            setSession({ status: "anonymous" });
          }
        }
      } catch (error) {
        console.error("Auth status check failed", error);
        if (!cancelled) setSession({ status: "anonymous" });
      }
    };

    checkAuthStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authAPI.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  const hasAdminAccess = useMemo(() => {
    if (session.status !== "authenticated" || !session.user.role) return false;
    const roles = Array.isArray(session.user.role) ? session.user.role : [session.user.role];
    return roles.some(role => role === "admin");
  }, [session]);

  const userDisplayName =
    session.status === "authenticated"
      ? session.user.name || session.user.email || t.user
      : "";

  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        backgroundColor: 'var(--color-gray-900)',
        width: '100%',
        transition: 'border-color 0.3s ease-in-out',
        borderBottom: `${isScrolled ? 'var(--color-gray-500)' : 'transparent'} solid 1px`
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: isScrolled ? '1rem' : '1.5rem',
          transition: 'padding 0.3s ease-in-out'
        }}
      >
        <a
          href={linkBuilder("/")}
          aria-label="SITCON Home"
          onMouseEnter={() => setHoveredLink('logo')}
          onMouseLeave={() => setHoveredLink(null)}
          style={{
            fontWeight: 700,
            letterSpacing: '0.2em',
            textDecoration: hoveredLink === 'logo' ? 'underline' : 'none',
            border: 'none',
            background: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer'
          }}
        >
          <Image src={"/assets/SITCON.svg"} width={32} height={32} alt="SITCON Logo" />
        </a>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem'
          }}
        >
          {session.status === "authenticated" ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <span
                style={{
                  fontWeight: 'bold',
                  color: 'var(--color-primary, #007acc)'
                }}
              >
                {userDisplayName}
              </span>
              {hasAdminAccess && (
                <a
                  href={linkBuilder("/admin/")}
                  onMouseEnter={() => setHoveredLink('admin')}
                  onMouseLeave={() => setHoveredLink(null)}
                  style={{
                    textDecoration: hoveredLink === 'admin' ? 'underline' : 'none',
                    border: 'none',
                    background: 'none',
                    color: 'inherit',
                    font: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {t.adminPage}
                </a>
              )}
              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={() => setHoveredLink('logout')}
                onMouseLeave={() => setHoveredLink(null)}
                disabled={isLoggingOut}
                style={{
                  textDecoration: hoveredLink === 'logout' ? 'underline' : 'none',
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                  padding: 0,
                  opacity: isLoggingOut ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoggingOut && <Spinner size="sm" />}
                {t.logout}
              </button>
            </div>
          ) : (
            <a
              href={linkBuilder("/login/")}
              onMouseEnter={() => setHoveredLink('login')}
              onMouseLeave={() => setHoveredLink(null)}
              style={{
                textDecoration: hoveredLink === 'login' ? 'underline' : 'none',
                border: 'none',
                background: 'none',
                color: 'inherit',
                font: 'inherit',
                cursor: 'pointer'
              }}
            >
              {t.login}
            </a>
          )}
        </div>
      </div>
      {children}
    </nav>
  );
}
