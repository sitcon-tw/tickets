"use client";

import Spinner from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { buildLocalizedLink, getTranslations } from "@/i18n/helpers";
import { routing } from "@/i18n/routing";
import { authAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SessionUser = {
	name?: string;
	email?: string;
	role?: string | string[];
};

type SessionState = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: SessionUser };

export default function Nav() {
	const pathname = usePathname();

	// Detect locale from pathname since we're outside NextIntlClientProvider
	const locale = useMemo(() => {
		const detectedLocale = routing.locales.find(loc => pathname.startsWith(`/${loc}`));
		return detectedLocale || routing.defaultLocale;
	}, [pathname]);

	const linkBuilder = useMemo(() => buildLocalizedLink(locale), [locale]);

	const [session, setSession] = useState<SessionState>({ status: "loading" });
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Check if on admin page
	const isAdminPage = pathname.includes("/admin");

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

	// Check for mobile viewport
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
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

	// Hide nav if both mobile and admin page
	if (isMobile && isAdminPage) {
		return null;
	}

	return (
		<nav className="fixed top-0 left-0 z-1000 w-full bg-gray-600 dark:bg-gray-900 border-b border-gray-700 dark:border-gray-800 transition-colors text-gray-200 dark:text-gray-300">
			<div className="flex items-center justify-between w-full max-w-7xl mx-auto px-4 py-4">
				<a href={linkBuilder("/")} aria-label="SITCON Home" className="flex items-center hover:opacity-80 transition-opacity translate-y-[-6%]">
					<Image src={"/assets/SITCONTIX.svg"} width={162} height={32} alt="SITCONTIX" />
				</a>
				<div className="flex items-center gap-4">
					{session.status === "authenticated" ? (
						<>
							<span className="text-sm  dark:text-gray-300">{userDisplayName}</span>
							{hasAdminAccess && (
								<a href={linkBuilder("/admin/")} className="text-sm  dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
									{t.adminPage}
								</a>
							)}
							<Button
								variant="ghost"
								size="sm"
								onClick={handleLogout}
								disabled={isLoggingOut}
								className={cn(
									"text-sm  dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors inline-flex items-center gap-2",
									isLoggingOut && "opacity-50 cursor-not-allowed"
								)}
							>
								{isLoggingOut && <Spinner size="sm" />}
								{t.logout}
							</Button>
						</>
					) : (
						<a href={`${linkBuilder("/login/")}?returnUrl=${encodeURIComponent(pathname)}`} className="text-sm  dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
							{t.login}
						</a>
					)}
					<ThemeToggle />
				</div>
			</div>
		</nav>
	);
}
