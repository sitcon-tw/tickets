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

  return (
    <nav className={isScrolled ? "scrolled" : ""}>
      <div className="nav-inner">
        <a className="logo" href={linkBuilder("/")} aria-label="SITCON Home">
          SITCON
        </a>
        <div className="right">
          {session.status === "authenticated" ? (
            <div className="user-menu">
              <span className="user-name">{userDisplayName}</span>
              {hasAdminAccess && (
                <a href={linkBuilder("/admin/")} className="admin-link">
                  管理員頁面
                </a>
              )}
              <button type="button" onClick={handleLogout} className="logout-link">
                登出
              </button>
            </div>
          ) : (
            <a href={linkBuilder("/login/")} className="login-link">
              登入
            </a>
          )}
        </div>
      </div>
      {children}
      <style jsx>{`
        nav {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          background-color: var(--color-gray-900);
          width: 100%;
          transition: border-color 0.3s ease-in-out;
          border-bottom: transparent solid 1px;
        }

        nav.scrolled {
          border-color: var(--color-gray-500);
        }

        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 1.5rem;
          transition: padding 0.3s ease-in-out;
        }

        nav.scrolled .nav-inner {
          padding: 1rem;
        }

        .logo {
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-name {
          font-weight: bold;
          color: var(--color-primary, #007acc);
        }

        nav a,
        nav button {
          text-decoration: none;
          border: none;
          background: none;
          color: inherit;
          font: inherit;
          cursor: pointer;
        }

        nav a:hover,
        nav button:hover {
          text-decoration: underline;
        }

        .logout-link {
          padding: 0;
        }
      `}</style>
    </nav>
  );
}
