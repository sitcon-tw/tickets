"use client";

import { AdminNavLayout, AdminNavPlaceholder } from "@/components/AdminNavLayout";
import { getTranslations } from "@/i18n/helpers";
import { usePathname, useRouter } from "@/i18n/navigation";
import { adminEventsAPI, authAPI } from "@/lib/api/endpoints";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { confirmNavigation } from "@/lib/hooks/useNavigationGuard";
import { setSelectedEventId, useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import type { Event } from "@sitcontix/types";
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
	const [grantedPermissions, setGrantedPermissions] = useState<string[] | null>(null);
	const [permissionsFailed, setPermissionsFailed] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);
	// isMobile is only known on the client; rendering before hydration would flash the desktop sidebar on phones.
	const hydrated = useHydrated();
	const currentEventId = useSelectedEventId();

	const dataLoadedRef = useRef(false);

	const loadPermissions = useCallback(async () => {
		setPermissionsFailed(false);
		try {
			const response = await authAPI.getPermissions();
			if (response.success && response.data) {
				setGrantedPermissions(response.data.grantedPermissions);
			} else {
				console.error("Failed to load permissions:", response.message);
				setPermissionsFailed(true);
			}
		} catch (error) {
			console.error("Failed to load permissions:", error);
			setPermissionsFailed(true);
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

	// Event, locale and logout changes don't go through a link, so ask pages with unsaved changes first.
	const handleEventChange = async (eventId: string) => {
		if (eventId === currentEventId) return;
		if (!(await confirmNavigation())) return;
		setSelectedEventId(eventId);
	};

	const handleLocaleChange = async (newLocale: string) => {
		if (newLocale === locale) return;
		if (!(await confirmNavigation())) return;
		router.replace(pathname, { locale: newLocale });
	};

	const handleLogout = async () => {
		if (isLoggingOut) return;
		if (!(await confirmNavigation())) return;
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
		systemTitle: { "zh-Hant": "管理員介面", en: "Admin Panel" },
		currentEvent: { "zh-Hant": "目前活動", en: "Current event" },
		selectEvent: { "zh-Hant": "選擇活動", en: "Select event" },
		noEvents: { "zh-Hant": "尚無活動", en: "No events yet" },
		statistics: { "zh-Hant": "報名統計", en: "Statistics" },
		events: { "zh-Hant": "活動管理", en: "Events" },
		ticketTypes: { "zh-Hant": "票種管理", en: "Ticket Types" },
		forms: { "zh-Hant": "表單管理", en: "Forms" },
		invitationCodes: { "zh-Hant": "邀請碼管理", en: "Invitation Codes" },
		sponsors: { "zh-Hant": "廠商廣告", en: "Sponsors" },
		registrations: { "zh-Hant": "報名資料", en: "Registrations" },
		checkIns: { "zh-Hant": "報到", en: "Check-ins" },
		webhooks: { "zh-Hant": "Webhook 設定", en: "Webhooks" },
		emailCampaigns: { "zh-Hant": "郵件發送", en: "Email Campaigns" },
		users: { "zh-Hant": "使用者管理", en: "Users" },
		roles: { "zh-Hant": "角色管理", en: "Roles" },
		settings: { "zh-Hant": "網站設定", en: "Site Settings" },
		groupSetup: { "zh-Hant": "活動設定", en: "Event setup" },
		groupAttendees: { "zh-Hant": "參加者", en: "Attendees" },
		groupSystem: { "zh-Hant": "系統", en: "System" },
		logout: { "zh-Hant": "登出", en: "Logout" },
		backHome: { "zh-Hant": "回到首頁", en: "Back to Home" },
		language: { "zh-Hant": "語言", en: "Language" },
		openMenu: { "zh-Hant": "開啟選單", en: "Open menu" },
		closeMenu: { "zh-Hant": "關閉選單", en: "Close menu" },
		loadingMenu: { "zh-Hant": "正在載入選單…", en: "Loading menu…" },
		menuLoadFailed: { "zh-Hant": "無法載入選單", en: "Could not load the menu" },
		retry: { "zh-Hant": "重試", en: "Retry" }
	});

	if (!isAdminPage) {
		return null;
	}

	if (!hydrated) {
		return <AdminNavPlaceholder />;
	}

	return (
		<AdminNavLayout
			t={t}
			locale={locale}
			pathname={pathname}
			currentEventId={currentEventId}
			events={events}
			grantedPermissions={grantedPermissions}
			permissionsFailed={permissionsFailed}
			isMobile={isMobile}
			mobileMenuOpen={mobileMenuOpen}
			isLoggingOut={isLoggingOut}
			onEventChange={eventId => void handleEventChange(eventId)}
			onLocaleChange={newLocale => void handleLocaleChange(newLocale)}
			onLogout={() => void handleLogout()}
			onRetryPermissions={() => void loadPermissions()}
			onMobileMenuOpenChange={setMobileMenuOpen}
		/>
	);
}

// Memoize the component to prevent unnecessary re-renders
export default memo(AdminNav);
