"use client";

import { useEffect, useRef } from "react";

/** Resolves to true when it is fine to navigate away (e.g. the user agreed to discard their changes). */
export type NavigationGuard = () => boolean | Promise<boolean>;

const guards = new Set<{ check: NavigationGuard }>();

/**
 * Asks every registered guard whether the user may leave the current state of the page.
 * Call it before navigation that doesn't go through a link click: switching event or locale, logging out.
 */
export async function confirmNavigation(): Promise<boolean> {
	for (const guard of [...guards]) {
		if (!(await guard.check())) return false;
	}
	return true;
}

/** Registers `guard` with {@link confirmNavigation} while `active` is true (e.g. while a form has unsaved changes). */
export function useNavigationGuard(active: boolean, guard: NavigationGuard) {
	const guardRef = useRef(guard);

	useEffect(() => {
		guardRef.current = guard;
	});

	useEffect(() => {
		if (!active) return;
		const entry = { check: () => guardRef.current() };
		guards.add(entry);
		return () => {
			guards.delete(entry);
		};
	}, [active]);
}
