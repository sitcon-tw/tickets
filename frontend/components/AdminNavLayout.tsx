"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { setSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { cn } from "@/lib/utils";
import { getLocalizedText } from "@/lib/utils/localization";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { Event, UserCapabilities } from "@sitcontix/types";
import { BarChart3, CalendarDays, ClipboardList, Globe, Home, KeyRound, LogOut, Mail, Menu, Settings, ShieldCheck, Ticket, Users, Webhook, X, type LucideIcon } from "lucide-react";

type NavItem = {
	href: string;
	i18nKey: string;
	icon: LucideIcon;
	requireCapability?: keyof UserCapabilities;
};

type NavGroup = {
	i18nKey: string | null;
	items: NavItem[];
};

const navGroups: NavGroup[] = [
	{
		i18nKey: null,
		items: [
			{ href: "/admin", i18nKey: "statistics", icon: BarChart3, requireCapability: "canViewAnalytics" },
			{ href: "/admin/events", i18nKey: "events", icon: CalendarDays }
		]
	},
	{
		i18nKey: "groupSetup",
		items: [
			{ href: "/admin/tickets", i18nKey: "ticketTypes", icon: Ticket },
			{ href: "/admin/forms", i18nKey: "forms", icon: ClipboardList },
			{ href: "/admin/invites", i18nKey: "invitationCodes", icon: KeyRound },
			{ href: "/admin/webhooks", i18nKey: "webhooks", icon: Webhook }
		]
	},
	{
		i18nKey: "groupAttendees",
		items: [
			{ href: "/admin/registrations", i18nKey: "registrations", icon: Users },
			{ href: "/admin/campaigns", i18nKey: "emailCampaigns", icon: Mail, requireCapability: "canManageEmailCampaigns" }
		]
	},
	{
		i18nKey: "groupSystem",
		items: [
			{ href: "/admin/users", i18nKey: "users", icon: ShieldCheck, requireCapability: "canManageUsers" },
			{ href: "/admin/settings", i18nKey: "settings", icon: Settings, requireCapability: "canManageSettings" }
		]
	}
];

const localeNames: Record<string, string> = {
	en: "English",
	"zh-Hant": "繁體中文",
	"zh-Hans": "简体中文"
};

export type AdminNavLayoutProps = {
	t: Record<string, string>;
	locale: string;
	/** Pathname without the locale prefix, e.g. "/admin/events". */
	pathname: string;
	currentEventId: string | null;
	events: Event[];
	capabilities: UserCapabilities | null;
	isMobile: boolean;
	mobileMenuOpen: boolean;
	isLoggingOut: boolean;
	onLocaleChange: (locale: string) => void;
	onLogout: () => void;
	onMobileMenuOpenChange: (open: boolean) => void;
};

function isItemActive(pathname: string, href: string) {
	const path = pathname.replace(/\/+$/, "") || "/";
	return href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);
}

function SidebarBody({
	t,
	locale,
	pathname,
	currentEventId,
	events,
	capabilities,
	isLoggingOut,
	onLocaleChange,
	onLogout,
	onNavigate,
	showThemeToggle
}: AdminNavLayoutProps & { onNavigate?: () => void; showThemeToggle?: boolean }) {
	const visibleGroups = navGroups
		.map(group => ({ ...group, items: group.items.filter(item => !item.requireCapability || capabilities?.[item.requireCapability]) }))
		.filter(group => group.items.length > 0);

	return (
		<div className="flex h-full flex-col gap-5 p-4">
			<div className="space-y-1.5">
				<span id="admin-event-select-label" className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					{t.currentEvent}
				</span>
				<Select value={currentEventId || ""} onValueChange={setSelectedEventId} disabled={events.length === 0}>
					<SelectTrigger className="h-10 w-full bg-background" aria-labelledby="admin-event-select-label">
						<SelectValue placeholder={events.length === 0 ? t.noEvents : t.selectEvent} />
					</SelectTrigger>
					<SelectContent>
						{events.map(event => (
							<SelectItem key={event.id} value={event.id}>
								{getLocalizedText(event.name, locale)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<nav aria-label={t.systemTitle} className="-mx-1 flex-1 space-y-5 overflow-y-auto px-1">
				{visibleGroups.map(group => (
					<div key={group.i18nKey ?? "main"} className="space-y-1">
						{group.i18nKey && <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t[group.i18nKey]}</div>}
						{group.items.map(({ href, i18nKey, icon: Icon }) => {
							const active = isItemActive(pathname, href);
							return (
								<Link
									key={href}
									href={href}
									onClick={onNavigate}
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
										active ? "bg-blue-600/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
									)}
								>
									<Icon className="size-4 shrink-0" />
									<span className="truncate">{t[i18nKey]}</span>
								</Link>
							);
						})}
					</div>
				))}
			</nav>

			<div className="space-y-2 border-t pt-4">
				<Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
					<Home className="size-4 shrink-0" />
					{t.backHome}
				</Link>
				<button
					type="button"
					onClick={onLogout}
					disabled={isLoggingOut}
					className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
				>
					<LogOut className="size-4 shrink-0" />
					{t.logout}
				</button>
				<div className="flex items-center gap-2 px-1 pt-1">
					<Globe aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
					<Select value={locale} onValueChange={onLocaleChange}>
						<SelectTrigger size="sm" className="flex-1" aria-label={t.language}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{routing.locales.map(loc => (
								<SelectItem key={loc} value={loc}>
									{localeNames[loc]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{showThemeToggle && <ThemeToggle />}
				</div>
			</div>
		</div>
	);
}

export function AdminNavLayout(props: AdminNavLayoutProps) {
	const { t, locale, pathname, currentEventId, events, isMobile, mobileMenuOpen, onMobileMenuOpenChange } = props;

	const currentItem = navGroups.flatMap(group => group.items).find(item => isItemActive(pathname, item.href));
	const currentEvent = events.find(event => event.id === currentEventId);
	const closeMobileMenu = () => onMobileMenuOpenChange(false);

	if (!isMobile) {
		return (
			<aside aria-label={t.systemTitle} className="sticky top-[73px] mt-[73px] h-[calc(100dvh-73px)] w-64 shrink-0 self-start overflow-y-auto border-r bg-muted/30">
				<SidebarBody {...props} />
			</aside>
		);
	}

	return (
		<>
			<div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur">
				<Button variant="ghost" size="icon" onClick={() => onMobileMenuOpenChange(true)} aria-label={t.openMenu}>
					<Menu className="size-5" />
				</Button>
				<div className="min-w-0 flex-1 leading-tight">
					<div className="truncate text-sm font-semibold">{currentItem ? t[currentItem.i18nKey] : t.systemTitle}</div>
					{currentEvent && <div className="truncate text-xs text-muted-foreground">{getLocalizedText(currentEvent.name, locale)}</div>}
				</div>
			</div>

			<DialogPrimitive.Root open={mobileMenuOpen} onOpenChange={onMobileMenuOpenChange}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
					<DialogPrimitive.Content
						aria-describedby={undefined}
						className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r bg-background shadow-xl outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left"
					>
						<VisuallyHidden>
							<DialogPrimitive.Title>{t.systemTitle}</DialogPrimitive.Title>
						</VisuallyHidden>
						<DialogPrimitive.Close asChild>
							<Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10" aria-label={t.closeMenu}>
								<X className="size-5" />
							</Button>
						</DialogPrimitive.Close>
						<div className="px-4 pt-4 text-lg font-semibold">{t.systemTitle}</div>
						<SidebarBody {...props} onNavigate={closeMobileMenu} showThemeToggle />
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</>
	);
}
