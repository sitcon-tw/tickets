"use client";

import { AdminNavLayout } from "@/components/AdminNavLayout";
import { getTranslations } from "@/i18n/helpers";
import { routing } from "@/i18n/routing";
import { adminEventsAPI, authAPI } from "@/lib/api/endpoints";
import { setSelectedEventId, useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import type { Event, UserCapabilities } from "@sitcontix/types";
import { useRouter as useNextRouter, usePathname } from "next/navigation";
import { memo, useCallback, useEffect, useEffectEvent, useMemo, useReducer, useRef } from "react";

type AdminNavState = {
	hoveredLink: string | null;
	events: Event[];
	mobileMenuOpen: boolean;
	isMobile: boolean;
	capabilities: UserCapabilities | null;
};

type AdminNavAction =
	| { type: "setHoveredLink"; hoveredLink: string | null }
	| { type: "setEvents"; events: Event[] }
	| { type: "setMobileMenuOpen"; mobileMenuOpen: boolean }
	| { type: "setIsMobile"; isMobile: boolean }
	| { type: "setCapabilities"; capabilities: UserCapabilities | null };

function adminNavReducer(state: AdminNavState, action: AdminNavAction): AdminNavState {
	switch (action.type) {
		case "setHoveredLink":
			return { ...state, hoveredLink: action.hoveredLink };
		case "setEvents":
			return { ...state, events: action.events };
		case "setMobileMenuOpen":
			return { ...state, mobileMenuOpen: action.mobileMenuOpen };
		case "setIsMobile":
			return { ...state, isMobile: action.isMobile };
		case "setCapabilities":
			return { ...state, capabilities: action.capabilities };
		default:
			return state;
	}
}

function AdminNav() {
	const pathname = usePathname();
	const isAdminPage = pathname.includes("/admin");
	const router = useNextRouter();

	const locale = useMemo(() => {
		const detectedLocale = routing.locales.find(loc => pathname.startsWith(`/${loc}`));
		return detectedLocale || routing.defaultLocale;
	}, [pathname]);

	const [{ hoveredLink, events, mobileMenuOpen, isMobile, capabilities }, dispatchAdminNav] = useReducer(adminNavReducer, {
		hoveredLink: null,
		events: [],
		mobileMenuOpen: false,
		isMobile: false,
		capabilities: null
	});
	const currentEventId = useSelectedEventId();

	const dataLoadedRef = useRef(false);

	const handleLocaleChange = (newLocale: string) => {
		// Replace the locale part in the pathname
		const pathWithoutLocale = pathname.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
		router.push(`/${newLocale}${pathWithoutLocale || "/"}`);
	};

	const loadPermissions = useCallback(async () => {
		try {
			const response = await authAPI.getPermissions();
			if (response.success && response.data) {
				dispatchAdminNav({ type: "setCapabilities", capabilities: response.data.capabilities });
			}
		} catch (error) {
			console.error("Failed to load permissions:", error);
		}
	}, []);

	const loadEvents = useCallback(async () => {
		try {
			const response = await adminEventsAPI.getAll();
			if (response.success && response.data && response.data.length > 0) {
				dispatchAdminNav({ type: "setEvents", events: response.data });

				const savedEventId = localStorage.getItem("selectedEventId");
				const eventExists = response.data.find(e => e.id === savedEventId);

				if (savedEventId && eventExists) {
					window.dispatchEvent(new CustomEvent("selectedEventChanged", { detail: { eventId: savedEventId } }));
				} else {
					setSelectedEventId(response.data[0].id);
				}
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	// Load data only once
	useEffect(() => {
		if (isAdminPage && !dataLoadedRef.current) {
			loadPermissions();
			loadEvents();
			dataLoadedRef.current = true;
		}
	}, [isAdminPage, loadPermissions, loadEvents]);

	// Listen for event list changes (when events are created/updated/deleted)
	const loadEventsEvent = useEffectEvent(loadEvents);

	useEffect(() => {
		if (!isAdminPage) return;

		const handleEventListChanged = () => {
			loadEventsEvent();
		};

		window.addEventListener("eventListChanged", handleEventListChanged);
		return () => window.removeEventListener("eventListChanged", handleEventListChanged);
	}, [isAdminPage]);

	useEffect(() => {
		if (!isAdminPage) return;

		const checkMobile = () => {
			dispatchAdminNav({ type: "setIsMobile", isMobile: window.innerWidth <= 768 });
		};

		checkMobile();

		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, [isAdminPage]);

	const handleNavClick = (href: string) => {
		// Add locale prefix to href
		const localizedHref = `/${locale}${href}`;
		router.push(localizedHref);
		dispatchAdminNav({ type: "setMobileMenuOpen", mobileMenuOpen: false });
	};

	useEffect(() => {
		if (!isAdminPage) return;

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && mobileMenuOpen) {
				dispatchAdminNav({ type: "setMobileMenuOpen", mobileMenuOpen: false });
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isAdminPage, mobileMenuOpen]);

	const t = getTranslations(locale, {
		systemTitle: {
			"zh-Hant": "管理員介面",
			"zh-Hans": "管理员界面",
			en: "Admin Panel"
		},
		statistics: {
			"zh-Hant": "報名統計",
			"zh-Hans": "报名统计",
			en: "Statistics"
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
		webhooks: {
			"zh-Hant": "Webhook 設定",
			"zh-Hans": "Webhook 设置",
			en: "Webhooks"
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

	if (!isAdminPage) {
		return null;
	}

	return (
		<AdminNavLayout
			t={t}
			locale={locale}
			pathname={pathname}
			currentEventId={currentEventId}
			events={events}
			capabilities={capabilities}
			hoveredLink={hoveredLink}
			isMobile={isMobile}
			mobileMenuOpen={mobileMenuOpen}
			onLocaleChange={handleLocaleChange}
			onNavClick={handleNavClick}
			onHoverLink={href => dispatchAdminNav({ type: "setHoveredLink", hoveredLink: href })}
			onOpenMobileMenu={() => dispatchAdminNav({ type: "setMobileMenuOpen", mobileMenuOpen: true })}
			onCloseMobileMenu={() => dispatchAdminNav({ type: "setMobileMenuOpen", mobileMenuOpen: false })}
		/>
	);
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AdminNav);
