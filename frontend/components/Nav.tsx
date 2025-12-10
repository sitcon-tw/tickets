"use client";

import Spinner from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { routing } from "@/i18n/routing";
import { authAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import crypto from "crypto";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
type SessionUser = {
	name?: string;
	email?: string;
	role?: string | string[];
};

type SessionState = { status: "loading" } | { status: "anonymous" } | { status: "authenticated"; user: SessionUser };

function getGravatarUrl(email: string, size = 40): string {
	const hash = crypto.createHash("md5").update(email.trim().toLowerCase()).digest("hex");
	return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

export default function Nav() {
	const pathname = usePathname();
	const router = useRouter();

	const locale = useMemo(() => {
		const detectedLocale = routing.locales.find(loc => pathname.startsWith(`/${loc}`));
		return detectedLocale || routing.defaultLocale;
	}, [pathname]);

	const localizedPath = (path: string) => `/${locale}${path}`;

	const [session, setSession] = useState<SessionState>({ status: "loading" });
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);

	const isAdminPage = pathname.includes("/admin");

	const t = getTranslations(locale, {
		adminPanel: { "zh-Hant": "管理員介面", "zh-Hans": "管理员介面", en: "Admin Panel" },
		myRegistrations: { "zh-Hant": "我的報名", "zh-Hans": "我的报名", en: "My Registrations" },
		logout: { "zh-Hant": "登出", "zh-Hans": "登出", en: "Logout" },
		login: { "zh-Hant": "登入", "zh-Hans": "登录", en: "Login" }
	});

	async function handleLogout() {
		if (isLoggingOut) return;
		setIsLoggingOut(true);
		try {
			await authAPI.signOut();
			setSession({ status: "anonymous" });
			router.push(localizedPath("/"));
		} catch (error) {
			console.error("Logout failed", error);
		} finally {
			setIsLoggingOut(false);
		}
	}

	const hasAdminAccess = useMemo(() => {
		if (session.status !== "authenticated" || !session.user.role) return false;
		const roles = Array.isArray(session.user.role) ? session.user.role : [session.user.role];
		const hasAccess = roles.some(role => role === "admin" || role === "eventAdmin");
		return hasAccess;
	}, [session]);

	useEffect(() => {
		if (session.status === "authenticated" && session.user.email) {
			setGravatarUrl(getGravatarUrl(session.user.email));
		} else {
			setGravatarUrl(null);
		}
	}, [session]);

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
						try {
							const permissionsData = await authAPI.getPermissions();
							if (permissionsData?.data?.role) {
								setSession({
									status: "authenticated",
									user: {
										...data.user,
										role: permissionsData.data.role
									}
								});
							} else {
								setSession({ status: "authenticated", user: data.user });
							}
						} catch (permError) {
							console.error("Failed to fetch permissions:", permError);
							setSession({ status: "authenticated", user: data.user });
						}
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
		function updateDarkMode() {
			const darkModeCheck = localStorage.getItem("sitcontix-theme");
			setIsDarkMode(darkModeCheck === "dark");
		}

		updateDarkMode();

		function handleThemeChange(event: CustomEvent) {
			setIsDarkMode(event.detail.newTheme === "dark");
		}

		window.addEventListener("systemThemeChanged", handleThemeChange as EventListener);
		return () => {
			window.removeEventListener("systemThemeChanged", handleThemeChange as EventListener);
		};
	}, []);

	if (isMobile && isAdminPage) {
		return null;
	}

	return (
		<nav
			className={`fixed top-0 left-0 z-1000 w-full ${isScrolled ? "bg-gray-600 dark:bg-gray-900/50 backdrop-blur-sm text-gray-200" : "dark:bg-transparent text-gray-600"} border-b border-gray-700 dark:border-gray-800 transition-colors duration-250 dark:text-gray-300`}
		>
			<div className={`flex items-center justify-between w-full mx-auto px-4 py-4 ${isAdminPage ? "px-12" : "max-w-7xl"}`}>
				<Link href={localizedPath("/")} aria-label="SITCON Home" className="flex items-center hover:opacity-80 transition-opacity translate-y-[-6%]">
					{isDarkMode || !isDarkMode && isScrolled ? (
						<>
							<Image src={"/assets/SITCONTIX.svg"} width={162} height={32} alt="SITCONTIX" className="hidden sm:block" />
							<Image src={"/assets/SITCON_WHITE.svg"} width={32} height={32} alt="SITCONTIX" className="sm:hidden" />
						</>
					) : (
						<>
							<Image src={"/assets/SITCONTIX_gray.svg"} width={162} height={32} alt="SITCONTIX" />
							<Image src={"/assets/SITCON.svg"} width={32} height={32} alt="SITCONTIX" className="sm:hidden" />
						</>
					)}
				</Link>
				<div className="flex items-center space-x-4">
					{session.status === "authenticated" ? (
						<>
							{hasAdminAccess && (
								<Link href={localizedPath("/admin/events")} className="text-sm dark:text-yellow-200 hover:text-gray-900 dark:hover:text-yellow-100 transition-colors">
									{t.adminPanel}
								</Link>
							)}
							<Link href={localizedPath("/my-registration")} className="text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
								{t.myRegistrations}
							</Link>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleLogout}
								disabled={isLoggingOut}
								className={cn(
									"text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-transparent transition-colors inline-flex items-center gap-2",
									isLoggingOut && "opacity-50 cursor-not-allowed"
								)}
							>
								{isLoggingOut && <Spinner size="sm" />}
								{t.logout}
							</Button>
							{gravatarUrl && <Image src={gravatarUrl} alt="User Avatar" width={32} height={32} className="w-8 h-8 rounded-full" />}
						</>
					) : session.status === "loading" ? (
						<Spinner size="sm" />
					) : (
						<Link
							href={pathname.includes("/login") ? localizedPath("/login/") : `${localizedPath("/login/")}?returnUrl=${encodeURIComponent(pathname)}`}
							className="text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
						>
							{t.login}
						</Link>
					)}
					<ThemeToggle />
				</div>
			</div>
		</nav>
	);
}
