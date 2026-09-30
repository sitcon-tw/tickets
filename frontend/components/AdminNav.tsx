"use client";

import { AdminNavLayout } from "@/components/AdminNavLayout";
import { getTranslations } from "@/i18n/helpers";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminEventsAPI, authAPI } from "@/lib/api/endpoints";
import { setSelectedEventId, useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import type { Event, UserCapabilities } from "@sitcontix/types";
import { useLocale } from "next-intl";
import { usePathname as useRawPathname } from "next/navigation";
import { memo, useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";

// Keep in sync with the breakpoint used by <Nav> to hide the site header on admin pages.
const mobileQuery = "(max-width: 768px)";

function subscribeMobile(callback: () => void) {
	const media = window.matchMedia(mobileQuery);
	media.addEventListener("change", callback);
	return () => media.removeEventListener("change", callback);
}
const getMobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const getMobileServerSnapshot = () => false;

function AdminNav() {
	const locale = useLocale();
	const router = useRouter();
	// Locale-less pathname for active-link matching; the raw one only tells us whether we are on an admin page.
	const pathname = usePathname();
	const isAdminPage = useRawPathname().includes("/admin");

	const [events, setEvents] = useState<Event[]>([]);
	const [capabilities, setCapabilities] = useState<UserCapabilities | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
	const currentEventId = useSelectedEventId();

	const dataLoadedRef = useRef(false);

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
			if (!response.success || !response.data) return;

			setEvents(response.data);

			const savedEventId = localStorage.getItem("selectedEventId");
			const savedEventExists = response.data.some(e => e.id === savedEventId);

			if (savedEventId && savedEventExists) {
				window.dispatchEvent(new CustomEvent("selectedEventChanged", { detail: { eventId: savedEventId } }));
			} else if (response.data.length > 0) {
				setSelectedEventId(response.data[0].id);
			} else if (savedEventId) {
				// The last event was deleted; don't keep pointing pages at a stale id.
				setSelectedEventId("");
			}
		} catch (error) {
			console.error("Failed to load events:", error);
		}
	}, []);

	// Load data only once
	useEffect(() => {
		if (isAdminPage && !dataLoadedRef.current) {
			void loadPermissions();
			void loadEvents();
			dataLoadedRef.current = true;
		}
	}, [isAdminPage, loadPermissions, loadEvents]);

	// Listen for event list changes (when events are created/updated/deleted)
	const loadEventsEvent = useEffectEvent(loadEvents);

	useEffect(() => {
		if (!isAdminPage) return;

		const handleEventListChanged = () => {
			void loadEventsEvent();
		};

		window.addEventListener("eventListChanged", handleEventListChanged);
		return () => window.removeEventListener("eventListChanged", handleEventListChanged);
	}, [isAdminPage]);

	// The drawer only exists on mobile; make sure it can't stay "open" after resizing to desktop.
	useEffect(() => {
		if (!isMobile) setMobileMenuOpen(false);
	}, [isMobile]);

	const handleLocaleChange = (newLocale: string) => {
		router.replace(pathname, { locale: newLocale });
	};

	const handleLogout = async () => {
		if (isLoggingOut) return;
		setIsLoggingOut(true);
		try {
			await authAPI.signOut();
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			setIsLoggingOut(false);
			setMobileMenuOpen(false);
			router.push("/");
		}
	};

	const t = getTranslations(locale, {
		systemTitle: { "zh-Hant": "管理員介面", "zh-Hans": "管理员界面", en: "Admin Panel" },
		currentEvent: { "zh-Hant": "目前活動", "zh-Hans": "当前活动", en: "Current event" },
		selectEvent: { "zh-Hant": "選擇活動", "zh-Hans": "选择活动", en: "Select event" },
		noEvents: { "zh-Hant": "尚無活動", "zh-Hans": "暂无活动", en: "No events yet" },
		statistics: { "zh-Hant": "報名統計", "zh-Hans": "报名统计", en: "Statistics" },
		events: { "zh-Hant": "活動管理", "zh-Hans": "活动管理", en: "Events" },
		ticketTypes: { "zh-Hant": "票種管理", "zh-Hans": "票种管理", en: "Ticket Types" },
		forms: { "zh-Hant": "表單管理", "zh-Hans": "表单管理", en: "Forms" },
		invitationCodes: { "zh-Hant": "邀請碼管理", "zh-Hans": "邀请码管理", en: "Invitation Codes" },
		registrations: { "zh-Hant": "報名資料", "zh-Hans": "报名资料", en: "Registrations" },
		webhooks: { "zh-Hant": "Webhook 設定", "zh-Hans": "Webhook 设置", en: "Webhooks" },
		emailCampaigns: { "zh-Hant": "郵件發送", "zh-Hans": "邮件发送", en: "Email Campaigns" },
		users: { "zh-Hant": "使用者管理", "zh-Hans": "用户管理", en: "Users" },
		groupSetup: { "zh-Hant": "活動設定", "zh-Hans": "活动设置", en: "Event setup" },
		groupAttendees: { "zh-Hant": "參加者", "zh-Hans": "参加者", en: "Attendees" },
		groupSystem: { "zh-Hant": "系統", "zh-Hans": "系统", en: "System" },
		logout: { "zh-Hant": "登出", "zh-Hans": "登出", en: "Logout" },
		backHome: { "zh-Hant": "回到首頁", "zh-Hans": "回到首页", en: "Back to Home" },
		language: { "zh-Hant": "語言", "zh-Hans": "语言", en: "Language" },
		openMenu: { "zh-Hant": "開啟選單", "zh-Hans": "打开菜单", en: "Open menu" },
		closeMenu: { "zh-Hant": "關閉選單", "zh-Hans": "关闭菜单", en: "Close menu" }
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
			isMobile={isMobile}
			mobileMenuOpen={mobileMenuOpen}
			isLoggingOut={isLoggingOut}
			onLocaleChange={handleLocaleChange}
			onLogout={() => void handleLogout()}
			onMobileMenuOpenChange={setMobileMenuOpen}
		/>
	);
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AdminNav);
