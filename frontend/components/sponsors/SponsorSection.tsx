"use client";

import MarkdownContent from "@/components/MarkdownContent";
import { buttonVariants } from "@/components/ui/button-variants";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getTranslations } from "@/i18n/helpers";
import { sponsorsAPI } from "@/lib/api/endpoints";
import { cn } from "@/lib/utils";
import { getLocalizedText } from "@/lib/utils/localization";
import type { PublicSponsor, SponsorPlacement } from "@sitcontix/types";
import { ExternalLink } from "lucide-react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

// Only web links are ever rendered as hrefs, whatever the API returned.
function safeWebUrl(url: string | null | undefined) {
	if (!url) return null;
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
	} catch {
		return null;
	}
}

function SponsorLogo({ sponsor, name, className, sizes }: { sponsor: PublicSponsor; name: string; className?: string; sizes: string }) {
	const [failed, setFailed] = useState(false);
	const [darkFailed, setDarkFailed] = useState(false);
	const logoUrl = safeWebUrl(sponsor.logoUrl);
	const darkUrl = safeWebUrl(sponsor.logoDarkUrl);
	const useDark = Boolean(darkUrl) && !darkFailed;

	if (!logoUrl || failed) {
		return <span className={cn("px-2 text-center text-sm font-semibold text-foreground", className)}>{name}</span>;
	}

	return (
		<div className={cn("relative size-full", className)}>
			{/* next/image with `unoptimized`: sponsor logos live on arbitrary hosts that are not in the image optimizer allow-list. */}
			<Image src={logoUrl} alt={name} fill sizes={sizes} unoptimized className={cn("object-contain", useDark && "dark:hidden")} onError={() => setFailed(true)} />
			{useDark && darkUrl && <Image src={darkUrl} alt="" aria-hidden="true" fill sizes={sizes} unoptimized className="hidden object-contain dark:block" onError={() => setDarkFailed(true)} />}
		</div>
	);
}

type SponsorSectionProps = {
	sponsors: PublicSponsor[];
	placement: SponsorPlacement;
	className?: string;
};

/**
 * Responsive grid of sponsor logos for one page slot. Clicking a logo opens a popup with the sponsor's introduction.
 * Reports impressions (grid scrolled into view once per page view), clicks (popup opened) and website link clicks.
 */
export default function SponsorSection({ sponsors, placement, className }: SponsorSectionProps) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		sponsorPartners: { "zh-Hant": "贊助夥伴", "zh-Hans": "赞助伙伴", en: "Sponsor Partners" },
		visitWebsite: { "zh-Hant": "前往官方網站", "zh-Hans": "前往官方网站", en: "Visit website" }
	});

	const visible = useMemo(() => sponsors.filter(sponsor => sponsor.placements.includes(placement)), [sponsors, placement]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = visible.find(sponsor => sponsor.id === selectedId) ?? null;

	const sectionRef = useRef<HTMLElement>(null);
	const impressionSent = useRef(false);

	useEffect(() => {
		const element = sectionRef.current;
		if (!element || visible.length === 0 || impressionSent.current) return;

		const observer = new IntersectionObserver(
			entries => {
				if (!entries.some(entry => entry.isIntersecting)) return;
				observer.disconnect();
				impressionSent.current = true;
				sponsorsAPI.track({ events: visible.slice(0, 50).map(sponsor => ({ sponsorId: sponsor.id, placement, type: "impression" as const })) });
			},
			{ threshold: 0.5 }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [visible, placement]);

	if (visible.length === 0) return null;

	const openSponsor = (sponsor: PublicSponsor) => {
		setSelectedId(sponsor.id);
		sponsorsAPI.track({ events: [{ sponsorId: sponsor.id, placement, type: "click" }] });
	};

	const selectedName = selected ? getLocalizedText(selected.name, locale) : "";
	const selectedDescription = selected ? getLocalizedText(selected.description, locale) : "";
	const selectedWebsite = selected ? safeWebUrl(selected.websiteUrl) : null;
	const headingId = `sponsors-${placement}`;

	return (
		<section ref={sectionRef} aria-labelledby={headingId} className={className}>
			<h2 id={headingId} className="mb-4 text-center text-sm font-semibold tracking-widest text-muted-foreground uppercase">
				{t.sponsorPartners}
			</h2>

			{/* Equal-size cards that wrap and stay centered, so 1–10 logos look balanced at every width. */}
			<ul className="flex flex-wrap justify-center gap-3">
				{visible.map(sponsor => {
					const name = getLocalizedText(sponsor.name, locale);
					return (
						<li key={sponsor.id} className="w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(20%-0.6rem)]">
							<button
								type="button"
								onClick={() => openSponsor(sponsor)}
								aria-haspopup="dialog"
								aria-label={name}
								className={cn(
									"flex h-20 w-full items-center justify-center rounded-xl border border-border p-3 shadow-xs transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:h-24",
									sponsor.logoDarkUrl ? "bg-white dark:bg-gray-900" : "bg-white"
								)}
							>
								<SponsorLogo sponsor={sponsor} name={name} sizes="(max-width: 640px) 45vw, 200px" />
							</button>
						</li>
					);
				})}
			</ul>

			<Dialog open={selected !== null} onOpenChange={open => !open && setSelectedId(null)}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
					{selected && (
						<>
							<div className={cn("mx-auto flex h-28 w-full max-w-64 items-center justify-center rounded-xl border p-4", selected.logoDarkUrl ? "bg-white dark:bg-gray-900" : "bg-white")}>
								<SponsorLogo sponsor={selected} name={selectedName} sizes="256px" />
							</div>
							<DialogHeader>
								<DialogTitle className="text-center text-xl">{selectedName}</DialogTitle>
								<DialogDescription className="sr-only">{selectedName}</DialogDescription>
							</DialogHeader>
							{selectedDescription && (
								<div className="prose dark:prose-invert max-w-none">
									<MarkdownContent content={selectedDescription} />
								</div>
							)}
							{selectedWebsite && (
								<a
									href={selectedWebsite}
									target="_blank"
									rel="noopener noreferrer sponsored"
									onClick={() => sponsorsAPI.track({ events: [{ sponsorId: selected.id, placement, type: "link_click" }] })}
									className={cn(buttonVariants({ variant: "primary" }), "mx-auto")}
								>
									{t.visitWebsite}
									<ExternalLink className="size-4" />
								</a>
							)}
						</>
					)}
				</DialogContent>
			</Dialog>
		</section>
	);
}
