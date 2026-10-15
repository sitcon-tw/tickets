"use client";

import { useSyncExternalStore } from "react";

const subscribeHydrated = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

/**
 * False during SSR and the hydration render, true afterwards.
 * Use it to hold back UI that depends on client-only state (localStorage, matchMedia) so it doesn't flash a wrong value first.
 */
export function useHydrated() {
	return useSyncExternalStore(subscribeHydrated, getClientHydrated, getServerHydrated);
}
