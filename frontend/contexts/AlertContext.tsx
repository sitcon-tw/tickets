"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AlertType = "success" | "error" | "warning" | "info";

export interface Alert {
	id: string;
	message: string;
	type: AlertType;
	duration?: number;
}

interface AlertContextType {
	alerts: Alert[];
	showAlert: (message: string, type: AlertType, duration?: number) => void;
	hideAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
	const [alerts, setAlerts] = useState<Alert[]>([]);

	const showAlert = useCallback((message: string, type: AlertType, duration: number = 5000) => {
		const id = Math.random().toString(36).substring(2, 9);
		const newAlert: Alert = { id, message, type, duration };

		setAlerts(prev => [...prev, newAlert]);

		if (duration > 0) {
			setTimeout(() => {
				hideAlert(id);
			}, duration);
		}
	}, []);

	const hideAlert = useCallback((id: string) => {
		setAlerts(prev => prev.filter(alert => alert.id !== id));
	}, []);

	return (
		<AlertContext.Provider value={{ alerts, showAlert, hideAlert }}>
			{children}
		</AlertContext.Provider>
	);
}

export function useAlert() {
	const context = useContext(AlertContext);
	if (context === undefined) {
		throw new Error("useAlert must be used within an AlertProvider");
	}
	return context;
}
