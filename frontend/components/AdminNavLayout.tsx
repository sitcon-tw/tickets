"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { routing } from "@/i18n/routing";
import { setSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Event, UserCapabilities } from "@sitcontix/types";
import { Globe, Menu, X } from "lucide-react";

const activityLinks = [
	{ href: "/admin/", i18nKey: "statistics", requireCapability: "canViewAnalytics" },
	{ href: "/admin/events/", i18nKey: "events", requireCapability: null },
	{ href: "/admin/tickets/", i18nKey: "ticketTypes", requireCapability: null },
	{ href: "/admin/forms/", i18nKey: "forms", requireCapability: null },
	{ href: "/admin/invites/", i18nKey: "invitationCodes", requireCapability: null },
	{ href: "/admin/registrations/", i18nKey: "registrations", requireCapability: null },
	{ href: "/admin/webhooks/", i18nKey: "webhooks", requireCapability: null },
	{ href: "/admin/campaigns/", i18nKey: "emailCampaigns", requireCapability: "canManageEmailCampaigns" },
	{ href: "/admin/users/", i18nKey: "users", requireCapability: "canManageUsers" }
] as const;

const localeNames: Record<string, string> = {
	en: "English",
	"zh-Hant": "\u7e41\u9ad4\u4e2d\u6587",
	"zh-Hans": "\u7b80\u4f53\u4e2d\u6587"
};

type AdminNavLayoutProps = {
	t: Record<string, string>;
	locale: string;
	pathname: string;
	currentEventId: string | null;
	events: Event[];
	capabilities: UserCapabilities | null;
	hoveredLink: string | null;
	isMobile: boolean;
	mobileMenuOpen: boolean;
	onLocaleChange: (locale: string) => void;
	onNavClick: (href: string) => void;
	onHoverLink: (href: string | null) => void;
	onOpenMobileMenu: () => void;
	onCloseMobileMenu: () => void;
};

function handleEventChange(eventId: string) {
	setSelectedEventId(eventId);
}

export function AdminNavLayout({
	t,
	locale,
	pathname,
	currentEventId,
	events,
	capabilities,
	hoveredLink,
	isMobile,
	mobileMenuOpen,
	onLocaleChange,
	onNavClick,
	onHoverLink,
	onOpenMobileMenu,
	onCloseMobileMenu
}: AdminNavLayoutProps) {
	const pathWithoutLocale = pathname.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
	const normalizedPath = pathWithoutLocale.endsWith("/") ? pathWithoutLocale : pathWithoutLocale + "/";

	return (
		<>
			{isMobile && (
				<div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-950 p-4 z-10 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
					<Button variant="ghost" size="icon" onClick={onOpenMobileMenu} aria-label="Open menu">
						<Menu size={24} />
					</Button>
					<div className="text-xl font-semibold">{t.systemTitle}</div>
					<div className="w-10" />
				</div>
			)}

			{isMobile && mobileMenuOpen && <button type="button" className="fixed inset-0 bg-black/50 z-40" onClick={onCloseMobileMenu} aria-label="Close menu overlay" />}

			<aside
				className={`
					bg-gray-50 dark:bg-gray-950 p-8 h-screen fixed top-0 left-0 z-45
					border-r border-gray-200 dark:border-gray-800 flex flex-col w-64
					transition-transform duration-300 ease-in-out sm:pt-24
					${isMobile ? (mobileMenuOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
					md:sticky md:translate-x-0
				`}
			>
				{isMobile && (
					<Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onCloseMobileMenu} aria-label="Close menu">
						<X size={24} />
					</Button>
				)}

				<div className="text-2xl mt-2 sm:text-xl text-center font-semibold">{t.systemTitle}</div>
				<div className="mb-6 mt-4">
					<Label className="flex flex-col gap-2">
						<span className="font-semibold text-sm opacity-80">{t.selectEvent}</span>
						<Select value={currentEventId || ""} onValueChange={handleEventChange}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{events.map(event => (
									<SelectItem key={event.id} value={event.id}>
										{getLocalizedText(event.name, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Label>
				</div>

				<nav className="mt-8 flex-1 overflow-y-auto">
					<ul className="pl-3 m-0">
						{activityLinks.flatMap(({ href, i18nKey, requireCapability }) => {
							if (requireCapability && (!capabilities || !capabilities[requireCapability as keyof UserCapabilities])) return [];
							const normalizedHref = href.endsWith("/") ? href : href + "/";
							const isActive = normalizedPath === normalizedHref || (normalizedHref !== "/admin/" && normalizedPath.startsWith(normalizedHref));

							return (
								<div key={href}>
									<li className="list-none mb-4">
										<button
											type="button"
											onClick={() => onNavClick(href)}
											onMouseEnter={() => onHoverLink(href)}
											onMouseLeave={() => onHoverLink(null)}
											className={`block w-full bg-transparent text-left pl-2 -ml-2 transition-all duration-200 cursor-pointer ${hoveredLink === href ? "underline" : ""} ${isActive ? "font-bold text-blue-600 dark:text-blue-500 border-l-[3px] border-blue-600 dark:border-blue-500" : "font-normal border-l-[3px] border-transparent"}`}
										>
											{t[i18nKey]}
										</button>
									</li>
									{i18nKey === "webhooks" && <hr className="border-0 border-t border-gray-300 dark:border-gray-700 my-4" />}
								</div>
							);
						})}
					</ul>
				</nav>

				<div className="flex flex-col gap-3 mt-4">
					<div className="font-semibold">{t.userPlaceholder}</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => onNavClick("/logout")}
							onMouseEnter={() => onHoverLink("logout")}
							onMouseLeave={() => onHoverLink(null)}
							className={`bg-transparent p-0 text-inherit cursor-pointer ${hoveredLink === "logout" ? "underline" : ""}`}
						>
							{t.logout}
						</button>
						<span>ãƒ»</span>
						<button
							type="button"
							onClick={() => onNavClick("/")}
							onMouseEnter={() => onHoverLink("home")}
							onMouseLeave={() => onHoverLink(null)}
							className={`bg-transparent p-0 text-inherit cursor-pointer ${hoveredLink === "home" ? "underline" : ""}`}
						>
							{t.backHome}
						</button>
					</div>
					<div className="flex justify-center items-center gap-2 mb-3">
						<Globe size={16} className="text-gray-500" />
						<select
							value={locale}
							onChange={e => onLocaleChange(e.target.value)}
							className="bg-transparent text-gray-700 dark:text-gray-600 border border-gray-400 dark:border-gray-500 rounded text-sm cursor-pointer hover:border-gray-500 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-gray-400 py-1 px-2"
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
		</>
	);
}
