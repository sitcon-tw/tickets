"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

/** True when the viewport matches `query`. Assumes `defaultValue` during SSR. */
export function useMediaQuery(query: string, defaultValue = false) {
	return useSyncExternalStore(
		callback => {
			const mql = window.matchMedia(query);
			mql.addEventListener("change", callback);
			return () => mql.removeEventListener("change", callback);
		},
		() => window.matchMedia(query).matches,
		() => defaultValue
	);
}

/**
 * Warns before leaving the page while there are unsaved changes: browser reload/close (beforeunload)
 * and in-app link clicks (the sidebar), which are routed through `confirmLeave`.
 */
export function useUnsavedChangesGuard(isDirty: boolean, confirmLeave: () => Promise<boolean>) {
	const router = useRouter();
	const confirmRef = useRef(confirmLeave);

	useEffect(() => {
		confirmRef.current = confirmLeave;
	});

	useEffect(() => {
		if (!isDirty) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		const handleClick = (event: MouseEvent) => {
			if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
			const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
			if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

			const url = new URL(anchor.href, window.location.href);
			if (url.origin !== window.location.origin) return;
			if (url.pathname === window.location.pathname && url.search === window.location.search) return;

			event.preventDefault();
			event.stopPropagation();
			void confirmRef.current().then(ok => {
				if (ok) router.push(url.pathname + url.search + url.hash);
			});
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		document.addEventListener("click", handleClick, true);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
			document.removeEventListener("click", handleClick, true);
		};
	}, [isDirty, router]);
}
