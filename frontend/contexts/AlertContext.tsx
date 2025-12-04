"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Alert, AlertType, AlertContextType } from "@/lib/types/contexts";

// Re-export for backward compatibility
export type { Alert, AlertType, AlertContextType };

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
	const showAlert = useCallback((message: string, type: AlertType, duration: number = 5000) => {
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
	}, []);

	return { showAlert };
}
