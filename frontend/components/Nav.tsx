"use client";

import Spinner from "@/components/Spinner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { authAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import crypto from "crypto";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
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
	const locale = useLocale();

	const [session, setSession] = useState<SessionState>({ status: "loading" });
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
			router.push("/");
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
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (isMobileMenuOpen && !target.closest(".mobile-menu") && !target.closest(".burger-button")) {
				setIsMobileMenuOpen(false);
			}
		};

		if (isMobileMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.body.style.overflow = "";
		};
	}, [isMobileMenuOpen]);

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
		<>
			<nav
				className={`fixed top-0 left-0 z-1000 w-full bg-gray-600 ${isScrolled ? " dark:bg-gray-900/50 backdrop-blur-sm" : "dark:bg-gray-900 sm:dark:bg-transparent"} text-gray-200 dark:text-gray-300 border-b border-gray-700 dark:border-gray-800 transition-colors duration-250`}
			>
				<div className={`flex items-center justify-between w-full mx-auto px-4 py-4 ${isAdminPage ? "px-12" : "max-w-7xl"}`}>
					<Link href="/" aria-label="SITCON Home" className="flex items-center hover:opacity-80 transition-opacity translate-y-[-6%]">
						<Image src={"/assets/SITCONTIX.svg"} width={162} height={32} alt="SITCONTIX" className="hidden sm:block" />
						<Image src={"/assets/SITCON_WHITE.svg"} width={32} height={32} alt="SITCONTIX" className="sm:hidden" />
					</Link>
					{/* Desktop Navigation */}
					<div className="hidden sm:flex items-center space-x-4">
						{session.status === "authenticated" ? (
							<>
								{hasAdminAccess && (
									<Link href="/admin/events" className="text-sm dark:text-yellow-200 hover:text-gray-900 dark:hover:text-yellow-100 transition-colors">
										{t.adminPanel}
									</Link>
								)}
								<Link href="/my-registration" className="text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
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
								href={pathname.includes("/login") ? "/login/" : `"/login/")}?returnUrl=${encodeURIComponent(pathname)}`}
								className="text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
							>
								{t.login}
							</Link>
						)}
						<ThemeToggle />
					</div>
					{/* Mobile Burger Menu Button */}
					<div className="flex sm:hidden items-center space-x-2">
						{ session.status === "authenticated" ? (
							<button
								onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
								className="burger-button p-2 text-gray-200 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
								aria-label="Toggle menu"
							>
								{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
						) : (
							<div className="flex items-center space-x-4">
								<Link
									href={pathname.includes("/login") ? "/login/" : `"/login/")}?returnUrl=${encodeURIComponent(pathname)}`}
									onClick={() => setIsMobileMenuOpen(false)}
									className="text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors py-2"
								>
									{t.login}
								</Link>
								<ThemeToggle />
							</div>
						)}
					</div>
				</div>
			</nav>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && <div className="fixed inset-0 z-200 bg-black/50 sm:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

			{/* Mobile Menu */}
			<div
				className={cn(
					"mobile-menu fixed top-[73px] right-0 z-300 h-[calc(100vh-73px)] w-64 bg-gray-600 dark:bg-gray-900 border-l border-gray-700 dark:border-gray-800 transition-transform duration-300 ease-in-out sm:hidden",
					isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
				)}
			>
				<div className="p-8 pb-4 space-y-4 text-gray-300 h-full">
					{session.status === "authenticated" ? (
						<div className="flex flex-col justify-between h-full">
							<div className="flex flex-col space-y-4">
								{gravatarUrl && (
									<div className="flex items-center space-x-3 pb-4 border-b border-gray-700 dark:border-gray-800">
										<Image src={gravatarUrl} alt="User Avatar" width={40} height={40} className="w-10 h-10 rounded-full" />
										<div className="flex flex-col">
											<span className="text-sm font-medium text-gray-200 dark:text-gray-300">{session.user.name}</span>
											<span className="text-xs text-gray-400">{session.user.email}</span>
										</div>
									</div>
								)}
								{hasAdminAccess && (
									<Link
										href="/admin/events"
										onClick={() => setIsMobileMenuOpen(false)}
										className="text-sm dark:text-yellow-200 hover:text-gray-900 dark:hover:text-yellow-100 transition-colors py-2"
									>
										{t.adminPanel}
									</Link>
								)}
								<Link href="/my-registration" onClick={() => setIsMobileMenuOpen(false)} className="text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors py-2">
									{t.myRegistrations}
								</Link>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setIsMobileMenuOpen(false);
										handleLogout();
									}}
									disabled={isLoggingOut}
									className={cn(
										"text-sm dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-transparent transition-colors inline-flex items-center gap-2 justify-start px-0",
										isLoggingOut && "opacity-50 cursor-not-allowed"
									)}
								>
									{isLoggingOut && <Spinner size="sm" />}
									{t.logout}
								</Button>
							</div>
							<ThemeToggle verbose />
						</div>
					) : session.status === "loading" && (
						<div className="flex justify-center py-4">
							<Spinner size="sm" />
						</div>
					)}
				</div>
			</div>
		</>
	);
}
