"use client";

import { Alert as AlertType, useAlert } from "@/contexts/AlertContext";
import { useEffect } from "react";
import { toast } from "sonner";

function AlertItem({ alert }: { alert: AlertType }) {
	const { hideAlert } = useAlert();

	useEffect(() => {
		// Show toast based on type
		switch (alert.type) {
			case "success":
				toast.success(alert.message, {
					id: alert.id,
					duration: 5000,
					onDismiss: () => hideAlert(alert.id),
					onAutoClose: () => hideAlert(alert.id)
				});
				break;
			case "error":
				toast.error(alert.message, {
					id: alert.id,
					duration: 7000,
					onDismiss: () => hideAlert(alert.id),
					onAutoClose: () => hideAlert(alert.id)
				});
				break;
			case "warning":
				toast.warning(alert.message, {
					id: alert.id,
					duration: 5000,
					onDismiss: () => hideAlert(alert.id),
					onAutoClose: () => hideAlert(alert.id)
				});
				break;
			case "info":
				toast.info(alert.message, {
					id: alert.id,
					duration: 5000,
					onDismiss: () => hideAlert(alert.id),
					onAutoClose: () => hideAlert(alert.id)
				});
				break;
		}
	}, [alert, hideAlert]);

	return null;
}

export function AlertContainer() {
	const { alerts } = useAlert();

	return (
		<>
			{alerts.map(alert => (
				<AlertItem key={alert.id} alert={alert} />
			))}
		</>
	);
}
