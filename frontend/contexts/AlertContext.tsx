"use client";

import { toast } from "sonner";

export type AlertType = "success" | "error" | "warning" | "info";

export interface Alert {
	id: string;
	message: string;
	type: AlertType;
	duration?: number;
}

interface AlertContextType {
	showAlert: (message: string, type: AlertType, duration?: number) => void;
}

/**
 * useAlert Hook - Wrapper around shadcn/sonner toast
 *
 * All alerts now use shadcn's toast component directly via sonner.
 * This hook maintains backward compatibility with the previous AlertContext API.
 *
 * Usage:
 * ```tsx
 * const { showAlert } = useAlert();
 * showAlert("Success message", "success");
 * showAlert("Error occurred", "error");
 * showAlert("Warning message", "warning");
 * showAlert("Info message", "info");
 * ```
 *
 * Or use toast directly from sonner:
 * ```tsx
 * import { toast } from "sonner";
 * toast.success("Success!");
 * toast.error("Error!");
 * ```
 */
export function useAlert(): AlertContextType {
	const showAlert = (message: string, type: AlertType, duration: number = 5000) => {
		switch (type) {
			case "success":
				toast.success(message, { duration });
				break;
			case "error":
				toast.error(message, { duration: duration || 7000 });
				break;
			case "warning":
				toast.warning(message, { duration });
				break;
			case "info":
				toast.info(message, { duration });
				break;
		}
	};

	return { showAlert };
}
