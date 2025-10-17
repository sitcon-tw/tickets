"use client";

import { getTranslations } from "@/i18n/helpers";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { adminEventsAPI, authAPI } from "@/lib/api/endpoints";
import type { Event, UserCapabilities } from "@/lib/types/api";
import { getLocalizedText } from "@/lib/utils/localization";
import { Globe, Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const activityLinks = [
	{ href: "/admin/", i18nKey: "overview", requireCapability: "canViewAnalytics" },
	{ href: "/admin/events/", i18nKey: "events", requireCapability: null }, // Always show
	{ href: "/admin/tickets/", i18nKey: "ticketTypes", requireCapability: null }, // Always show
	{ href: "/admin/invites/", i18nKey: "invitationCodes", requireCapability: null }, // Always show
	{ href: "/admin/registrations/", i18nKey: "registrations", requireCapability: null }, // Always show
	{ href: "/admin/campaigns/", i18nKey: "emailCampaigns", requireCapability: "canManageEmailCampaigns" },
	{ href: "/admin/users/", i18nKey: "users", requireCapability: "canManageUsers" }
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
		fontSize: "1.2rem",
		zIndex: 1000,
		transition: "transform 0.3s ease-in-out"
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
	},
	mobileHeader: {
		display: "none",
		position: "fixed" as const,
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "var(--color-gray-950)",
		padding: "1rem",
		zIndex: 999,
		alignItems: "center",
		justifyContent: "space-between",
		borderBottom: "1px solid var(--color-gray-800)"
	},
	hamburger: {
		background: "none",
		border: "none",
		color: "var(--color-gray-100)",
		cursor: "pointer",
		padding: "0.5rem"
	},
	overlay: {
		display: "none",
		position: "fixed" as const,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		zIndex: 998
	},
	closeButton: {
		position: "absolute" as const,
		top: "1rem",
		right: "1rem",
		background: "none",
		border: "none",
		color: "var(--color-gray-100)",
		cursor: "pointer",
		padding: "0.5rem"
	}
};

export default function AdminNav() {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();

	const [hoveredLink, setHoveredLink] = useState<string | null>(null);
	const [events, setEvents] = useState<Event[]>([]);
	const [currentEventId, setCurrentEventId] = useState<string | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);
	const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null);

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

				// Check localStorage for saved event selection
				const savedEventId = localStorage.getItem("selectedEventId");
				const eventExists = response.data.find(e => e.id === savedEventId);

				if (savedEventId && eventExists) {
					setCurrentEventId(savedEventId);
				} else {
					// Default to first event
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
		// Dispatch custom event to notify other components
		window.dispatchEvent(new CustomEvent("selectedEventChanged", { detail: { eventId } }));
	};

	useEffect(() => {
		loadPermissions();
		loadEvents();
	}, [loadPermissions, loadEvents]);

	// Handle mobile detection and window resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		// Initial check
		checkMobile();

		// Listen to window resize
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	useEffect(() => {
		// Inject global styles for main element
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

		return () => {
			const style = document.getElementById(styleId);
			if (style) {
				style.remove();
			}
		};
	}, []);

	// Close mobile menu when clicking a link
	const handleNavClick = (href: string) => {
		router.push(href);
		setMobileMenuOpen(false);
	};

	// Close mobile menu on escape key
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
			<div style={{ ...styles.mobileHeader, display: isMobile ? "flex" : "none" }}>
				<button style={styles.hamburger} onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
					<Menu size={24} />
				</button>
				<div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{t.activityName}</div>
				<div style={{ width: "40px" }} /> {/* Spacer for centering */}
			</div>

			{/* Overlay for mobile */}
			{mobileMenuOpen && <div style={{ ...styles.overlay, display: "block" }} onClick={() => setMobileMenuOpen(false)} />}

			{/* Sidebar */}
			<aside
				style={{
					...styles.aside,
					transform: isMobile ? (mobileMenuOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)"
				}}
			>
				{/* Close button for mobile */}
				{isMobile && (
					<button style={styles.closeButton} onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
						<X size={24} />
					</button>
				)}
				<div style={styles.activity}>{t.activityName}</div>
				<div style={styles.title}>{t.systemTitle}</div>
				<div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
					<label
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "0.5rem"
						}}
					>
						<span style={{ fontWeight: 600, fontSize: "0.85rem", opacity: 0.8 }}>{t.selectEvent}</span>
						<select
							value={currentEventId || ""}
							onChange={e => handleEventChange(e.target.value)}
							style={{
								padding: "0.6rem",
								border: "2px solid var(--color-gray-600)",
								background: "var(--color-gray-800)",
								color: "inherit",
								borderRadius: "6px",
								fontSize: "0.9rem",
								cursor: "pointer"
							}}
						>
							{events.map(event => (
								<option key={event.id} value={event.id}>
									{getLocalizedText(event.name, locale)}
								</option>
							))}
						</select>
					</label>
				</div>
				<nav style={styles.nav}>
					<ul style={styles.navList}>
						{activityLinks
							.filter(({ requireCapability }) => {
								// If no capability required, always show
								if (!requireCapability) return true;
								// If capabilities not loaded yet, hide it to prevent flashing
								if (!capabilities) return false;
								// Check if user has the required capability
								return capabilities[requireCapability as keyof UserCapabilities];
							})
							.map(({ href, i18nKey }) => (
								<li key={href} style={styles.navItem}>
									<a
										onClick={() => handleNavClick(href)}
										onMouseEnter={() => setHoveredLink(href)}
										onMouseLeave={() => setHoveredLink(null)}
										style={{
											textDecoration: hoveredLink === href ? "underline" : "none"
										}}
										className="cursor-pointer"
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
							onClick={() => {
								router.push("/logout");
								setMobileMenuOpen(false);
							}}
							onMouseEnter={() => setHoveredLink("logout")}
							onMouseLeave={() => setHoveredLink(null)}
							style={{
								textDecoration: hoveredLink === "logout" ? "underline" : "none"
							}}
							className="cursor-pointer"
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
							style={{
								textDecoration: hoveredLink === "home" ? "underline" : "none"
							}}
							className="cursor-pointer"
						>
							{t.backHome}
						</a>
					</div>
					<div className="flex justify-center items-center" style={{ gap: "0.5rem", marginBottom: "0.75rem" }}>
						<Globe size={16} className="text-gray-500" />
						<select value={locale} onChange={e => handleLocaleChange(e.target.value)} className="bg-transparent text-gray-600 border border-gray-500 rounded text-sm cursor-pointer hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400" style={{ padding: "0.25rem 0.5rem" }}>
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
