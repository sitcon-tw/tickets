"use client";

import { useSyncExternalStore } from "react";

const selectedEventStorageKey = "selectedEventId";
const selectedEventChangedEvent = "selectedEventChanged";

function getSelectedEventSnapshot() {
	if (typeof localStorage === "undefined") return null;
	return localStorage.getItem(selectedEventStorageKey);
}

function getServerSelectedEventSnapshot() {
	return null;
}

function subscribeSelectedEvent(callback: () => void) {
	if (typeof window === "undefined") return () => {};

	const handleSelectedEventChanged = () => callback();
	const handleStorage = (event: StorageEvent) => {
		if (event.key === selectedEventStorageKey) callback();
	};

	window.addEventListener(selectedEventChangedEvent, handleSelectedEventChanged);
	window.addEventListener("storage", handleStorage);

	return () => {
		window.removeEventListener(selectedEventChangedEvent, handleSelectedEventChanged);
		window.removeEventListener("storage", handleStorage);
	};
}

export function setSelectedEventId(eventId: string) {
	localStorage.setItem(selectedEventStorageKey, eventId);
	window.dispatchEvent(new CustomEvent(selectedEventChangedEvent, { detail: { eventId } }));
}

export function useSelectedEventId() {
	return useSyncExternalStore(subscribeSelectedEvent, getSelectedEventSnapshot, getServerSelectedEventSnapshot);
}
