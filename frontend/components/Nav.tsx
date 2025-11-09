"use client";

import Spinner from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildLocalizedLink, getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

type NavProps = {
	children?: ReactNode;
};

type SessionUser = {
	name?: string;
	email?: string;
	role?: string | string[];
};

type SessionState = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: SessionUser };

export default function Nav({ children }: NavProps) {
	const locale = useLocale();
	const linkBuilder = useMemo(() => buildLocalizedLink(locale), [locale]);
	const pathname = usePathname();

	const [session, setSession] = useState<SessionState>({ status: "loading" });
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const t = getTranslations(locale, {
		user: { "zh-Hant": "使用者", "zh-Hans": "用户", en: "User" },
		adminPage: { "zh-Hant": "管理員頁面", "zh-Hans": "管理员页面", en: "Admin Panel" },
		logout: { "zh-Hant": "登出", "zh-Hans": "登出", en: "Logout" },
		login: { "zh-Hant": "登入", "zh-Hans": "登录", en: "Login" }
	});

	async function handleLogout() {
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
	}

	const hasAdminAccess = useMemo(() => {
		if (session.status !== "authenticated" || !session.user.role) return false;
		const roles = Array.isArray(session.user.role) ? session.user.role : [session.user.role];
		return roles.some(role => role === "admin");
	}, [session]);

	const userDisplayName =
		session.status === "authenticated" ? (session.user.name ? session.user.name + (session.user.email ? ` (${session.user.email})` : "") : session.user.email ? session.user.email : t.user) : "";

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

	if (pathname.includes("/admin")) {
		return null;
	}

	return (
		<nav className="fixed top-0 left-0 z-[1000] w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors">
			<div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-3">
				<a href={linkBuilder("/")} aria-label="SITCON Home" className="flex items-center hover:opacity-80 transition-opacity">
					<Image src={"/assets/SITCON.svg"} width={32} height={32} alt="SITCON Logo" className="dark:invert" />
				</a>
				<div className="flex items-center gap-4">
					{session.status === "authenticated" ? (
						<>
							<span className="text-sm text-gray-700 dark:text-gray-300">{userDisplayName}</span>
							{hasAdminAccess && (
								<a href={linkBuilder("/admin/")} className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
									{t.adminPage}
								</a>
							)}
							<button
								type="button"
								onClick={handleLogout}
								disabled={isLoggingOut}
								className={cn("text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-2", isLoggingOut && "opacity-50 cursor-not-allowed")}
							>
								{isLoggingOut && <Spinner size="sm" />}
								{t.logout}
							</button>
						</>
					) : (
						<a href={`${linkBuilder("/login/")}?returnUrl=${encodeURIComponent(pathname)}`} className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
							{t.login}
						</a>
					)}
					<ThemeToggle />
				</div>
			</div>
			{children}
		</nav>
	);
}
