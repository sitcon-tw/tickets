"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import * as i18n from "@/i18n";

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
  const pathname = usePathname();
  const currentPath = pathname ?? "/";
  const linkBuilder = useMemo(() => i18n.l(currentPath), [currentPath]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5);
    };

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
        const response = await fetch("http://localhost:3000/api/auth/get-session", {
          credentials: "include"
        });

        if (!response.ok) {
          if (!cancelled) setSession({ status: "anonymous" });
          return;
        }

        const data = await response.json();
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
    try {
      await fetch("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        credentials: "include"
      });
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
    return roles.some(role => role === "admin" || role === "super-admin");
  }, [session]);

  const userDisplayName =
    session.status === "authenticated"
      ? session.user.name || session.user.email || "使用者"
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
          SITCON
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
                  管理員頁面
                </a>
              )}
              <button
                type="button"
                onClick={handleLogout}
                onMouseEnter={() => setHoveredLink('logout')}
                onMouseLeave={() => setHoveredLink(null)}
                style={{
                  textDecoration: hoveredLink === 'logout' ? 'underline' : 'none',
                  border: 'none',
                  background: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                登出
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
              登入
            </a>
          )}
        </div>
      </div>
      {children}
    </nav>
  );
}
