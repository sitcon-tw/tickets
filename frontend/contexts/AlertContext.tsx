"use client";

import { Alert, AlertContextType, AlertType } from "@/lib/types/contexts";
import { useCallback } from "react";
import { toast } from "sonner";

// Re-export for backward compatibility
export type { Alert, AlertContextType, AlertType };

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
// Errors stay up longer: they usually need reading and acting on.
const DEFAULT_DURATIONS: Record<AlertType, number> = {
	success: 5000,
	error: 7000,
	warning: 5000,
	info: 5000
};

export function useAlert(): AlertContextType {
	const showAlert = useCallback((message: string, type: AlertType, duration?: number) => {
		const options = { duration: duration ?? DEFAULT_DURATIONS[type] };
		switch (type) {
			case "success":
				toast.success(message, options);
				break;
			case "error":
				toast.error(message, options);
				break;
			case "warning":
				toast.warning(message, options);
				break;
			case "info":
				toast.info(message, options);
				break;
		}
	}, []);

	return { showAlert };
}
