// Context Types

export type AlertType = "success" | "error" | "warning" | "info";

export interface Alert {
	id: string;
	message: string;
	type: AlertType;
	duration?: number;
}

export interface AlertContextType {
	showAlert: (message: string, type: AlertType, duration?: number) => void;
}
