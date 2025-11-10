"use client";

import { getTranslations } from "@/i18n/helpers";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { adminEventsAPI, authAPI } from "@/lib/api/endpoints";
import type { Event, UserCapabilities } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { Globe, Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import { memo, useCallback, useEffect, useRef, useState } from "react";

const activityLinks = [
	{ href: "/admin/", i18nKey: "overview", requireCapability: "canViewAnalytics" },
	{ href: "/admin/events/", i18nKey: "events", requireCapability: null }, // Always show
	{ href: "/admin/tickets/", i18nKey: "ticketTypes", requireCapability: null }, // Always show
	{ href: "/admin/forms/", i18nKey: "forms", requireCapability: null }, // Always show
	{ href: "/admin/invites/", i18nKey: "invitationCodes", requireCapability: null }, // Always show
	{ href: "/admin/registrations/", i18nKey: "registrations", requireCapability: null }, // Always show
	{ href: "/admin/campaigns/", i18nKey: "emailCampaigns", requireCapability: "canManageEmailCampaigns" },
	{ href: "/admin/users/", i18nKey: "users", requireCapability: "canManageUsers" }
] as const;

function AdminNav() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const [hoveredLink, setHoveredLink] = useState<string | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null);

	// Track if data has been loaded to prevent re-fetching
	const dataLoadedRef = useRef(false);

	const handleLocaleChange = (newLocale: string) => {
		router.replace(pathname, { locale: newLocale });
	};

	const localeNames: Record<string, string> = {
		en: "English",
		"zh-Hant": "繁體中文",
		"zh-Hans": "简体中文"
	};

	const loadPermissions = useCallback(async () => {
		try {
			const response = await authAPI.getPermissions();
			if (response.success && response.data) {
				setCapabilities(response.data.capabilities);
			}
		} catch (error) {
			console.error("Failed to load permissions:", error);
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success && response.data && response.data.length > 0) {
				setEvents(response.data);

				const savedEventId = localStorage.getItem("selectedEventId");
				const eventExists = response.data.find(e => e.id === savedEventId);

				if (savedEventId && eventExists) {
					setCurrentEventId(savedEventId);
				} else {
					setCurrentEventId(response.data[0].id);
					localStorage.setItem("selectedEventId", response.data[0].id);
				}
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	const handleEventChange = (eventId: string) => {
		setCurrentEventId(eventId);
		localStorage.setItem("selectedEventId", eventId);
		window.dispatchEvent(new CustomEvent("selectedEventChanged", { detail: { eventId } }));
	};

	// Load data only once
	useEffect(() => {
		if (!dataLoadedRef.current) {
			loadPermissions();
			loadEvents();
			dataLoadedRef.current = true;
		}
	}, [loadPermissions, loadEvents]);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();

		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Inject styles only once and don't remove them on unmount
	useEffect(() => {
		const styleId = "admin-nav-global-styles";
		if (!document.getElementById(styleId)) {
			const style = document.createElement("style");
			style.id = styleId;
			style.textContent = `
        main {
          padding-top: 5rem;
          max-width: unset;
          margin-left: 17rem;
        }

        @media (max-width: 768px) {
          main {
            margin-left: 0 !important;
            padding-top: 5rem !important;
          }
        }
      `;
			document.head.appendChild(style);
		}
		// Don't remove styles on unmount to prevent layout shift
	}, []);

	const handleNavClick = (href: string) => {
		router.push(href);
		setMobileMenuOpen(false);
	};

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && mobileMenuOpen) {
				setMobileMenuOpen(false);
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [mobileMenuOpen]);

	const t = getTranslations(locale, {
		activityName: {
			"zh-Hant": "SITCON",
			"zh-Hans": "SITCON",
			en: "SITCON"
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
		events: {
			"zh-Hant": "活動管理",
			"zh-Hans": "活动管理",
			en: "Event Management"
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
		emailCampaigns: {
			"zh-Hant": "郵件發送",
			"zh-Hans": "邮件发送",
			en: "Email Campaigns"
		},
		users: {
			"zh-Hant": "使用者管理",
			"zh-Hans": "用户管理",
			en: "User Management"
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
		},
		selectEvent: {
			"zh-Hant": "選擇活動",
			"zh-Hans": "选择活动",
			en: "Select Event"
		}
	});

	return (
		<>
			{/* Mobile Header */}
			<div className={`fixed top-0 left-0 right-0 bg-gray-950 p-4 z-999 items-center justify-between border-b border-gray-800 ${isMobile ? "flex" : "hidden"}`}>
				<button className="bg-transparent border-none text-gray-100 cursor-pointer p-2" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
					<Menu size={24} />
				</button>
				<div className="text-xl font-semibold">{t.activityName}</div>
				<div className="w-10" /> {/* Spacer for centering */}
			</div>

			{/* Overlay for mobile */}
			{mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-998" onClick={() => setMobileMenuOpen(false)} />}

			{/* Sidebar */}
			<aside
				className={`bg-gray-950 p-8 w-68 h-dvh fixed flex flex-col text-xl z-1000 transition-transform duration-300 ease-in-out ${isMobile ? (mobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
			>
				{/* Close button for mobile */}
				{isMobile && (
					<button className="absolute top-4 right-4 bg-transparent border-none text-gray-100 cursor-pointer p-2" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
						<X size={24} />
					</button>
				)}
				<div className="text-xl">{t.activityName}</div>
				<div className="text-3xl mt-2">{t.systemTitle}</div>
				<div className="mb-6 mt-4">
					<label className="flex flex-col gap-2">
						<span className="font-semibold text-sm opacity-80">{t.selectEvent}</span>
						<select
							value={currentEventId || ""}
							onChange={e => handleEventChange(e.target.value)}
							className="p-2.5 border-2 border-gray-600 bg-gray-800 text-inherit rounded-md text-sm cursor-pointer"
						>
							{events.map(event => (
								<option key={event.id} value={event.id}>
									{getLocalizedText(event.name, locale)}
								</option>
							))}
						</select>
					</label>
				</div>
				<nav className="mt-8 flex-1">
					<ul className="pl-3 m-0">
						{activityLinks
							.filter(({ requireCapability }) => {
								if (!requireCapability) return true;
								if (!capabilities) return false;
								return capabilities[requireCapability as keyof UserCapabilities];
							})
							.map(({ href, i18nKey }) => {
								// Remove locale prefix and normalize trailing slashes for comparison
								const pathWithoutLocale = pathname.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
								const normalizedPath = pathWithoutLocale.endsWith("/") ? pathWithoutLocale : pathWithoutLocale + "/";
								const normalizedHref = href.endsWith("/") ? href : href + "/";
								const isActive = normalizedPath === normalizedHref || (normalizedHref !== "/admin/" && normalizedPath.startsWith(normalizedHref));
								return (
									<div key={href}>
										<li className="list-none mb-4">
											<a
												onClick={() => handleNavClick(href)}
												onMouseEnter={() => setHoveredLink(href)}
												onMouseLeave={() => setHoveredLink(null)}
												className={`block pl-2 -ml-2 transition-all duration-200 cursor-pointer ${hoveredLink === href ? "underline" : ""} ${isActive ? "font-bold text-blue-500 border-l-[3px] border-blue-500" : "font-normal border-l-[3px] border-transparent"}`}
											>
												{t[i18nKey]}
											</a>
										</li>
										{i18nKey === "registrations" && <hr className="border-0 border-t border-gray-700 my-4" />}
									</div>
								);
							})}
					</ul>
				</nav>
				<div className="flex flex-col gap-3">
					<div className="font-semibold">{t.userPlaceholder}</div>
					<div className="flex gap-2">
						<a
							onClick={() => {
								router.push("/logout");
								setMobileMenuOpen(false);
							}}
							onMouseEnter={() => setHoveredLink("logout")}
							onMouseLeave={() => setHoveredLink(null)}
							className={`cursor-pointer ${hoveredLink === "logout" ? "underline" : ""}`}
						>
							{t.logout}
						</a>
						<span>・</span>
						<a
							onClick={() => {
								router.push("/");
								setMobileMenuOpen(false);
							}}
							onMouseEnter={() => setHoveredLink("home")}
							onMouseLeave={() => setHoveredLink(null)}
							className={`cursor-pointer ${hoveredLink === "home" ? "underline" : ""}`}
						>
							{t.backHome}
						</a>
					</div>
					<div className="flex justify-center items-center gap-2 mb-3">
						<Globe size={16} className="text-gray-500" />
						<select
							value={locale}
							onChange={e => handleLocaleChange(e.target.value)}
							className="bg-transparent text-gray-600 border border-gray-500 rounded text-sm cursor-pointer hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 py-1 px-2"
						>
							{routing.locales.map(loc => (
								<option key={loc} value={loc}>
									{localeNames[loc]}
								</option>
							))}
						</select>
					</div>
				</div>
			</aside>

			{/* Inject mobile-specific CSS */}
			<style jsx>{`
				@media (max-width: 768px) {
					aside {
						transform: ${mobileMenuOpen ? "translateX(0)" : "translateX(-100%)"} !important;
					}
				}
			`}</style>
		</>
	);
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AdminNav);
