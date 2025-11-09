"use client";

import Spinner from "@/components/Spinner";
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

	const [isScrolled, setIsScrolled] = useState(false);
	const [session, setSession] = useState<SessionState>({ status: "loading" });
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [hoveredLink, setHoveredLink] = useState<string | null>(null);

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

	if (pathname.includes("/admin")) {
		return null;
	}

	return (
		<nav
			className={cn(
				"fixed top-0 left-0 z-[1000] w-full transition-all duration-300 ease-in-out",
				isScrolled ? "bg-gray-900 border-b border-gray-500" : "bg-transparent border-b border-transparent"
			)}
		>
			<div
				className={cn(
					"flex items-center justify-between w-full transition-all duration-300 ease-in-out",
					isScrolled ? "p-4" : "p-6"
				)}
			>
				<a
					href={linkBuilder("/")}
					aria-label="SITCON Home"
					onMouseEnter={() => setHoveredLink("logo")}
					onMouseLeave={() => setHoveredLink(null)}
					className={cn(
						"font-bold tracking-wider border-none bg-transparent cursor-pointer",
						hoveredLink === "logo" && "underline"
					)}
				>
					<Image src={"/assets/SITCON.svg"} width={32} height={32} alt="SITCON Logo" />
				</a>
				<div className="flex items-center gap-6">
					{session.status === "authenticated" ? (
						<div className="flex items-center gap-4">
							<span className="text-blue-400">{userDisplayName}</span>
							{hasAdminAccess && (
								<a
									href={linkBuilder("/admin/")}
									onMouseEnter={() => setHoveredLink("admin")}
									onMouseLeave={() => setHoveredLink(null)}
									className={cn(
										"border-none bg-transparent cursor-pointer transition-all",
										hoveredLink === "admin" && "underline"
									)}
								>
									{t.adminPage}
								</a>
							)}
							<button
								type="button"
								onClick={handleLogout}
								onMouseEnter={() => setHoveredLink("logout")}
								onMouseLeave={() => setHoveredLink(null)}
								disabled={isLoggingOut}
								className={cn(
									"border-none bg-transparent p-0 inline-flex items-center gap-2 transition-opacity",
									hoveredLink === "logout" && "underline",
									isLoggingOut ? "cursor-not-allowed opacity-70" : "cursor-pointer"
								)}
							>
								{isLoggingOut && <Spinner size="sm" />}
								{t.logout}
							</button>
						</div>
					) : (
						<a
							href={`${linkBuilder("/login/")}?returnUrl=${encodeURIComponent(pathname)}`}
							onMouseEnter={() => setHoveredLink("login")}
							onMouseLeave={() => setHoveredLink(null)}
							className={cn(
								"border-none bg-transparent cursor-pointer transition-all",
								hoveredLink === "login" && "underline"
							)}
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
