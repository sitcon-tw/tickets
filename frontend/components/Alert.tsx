"use client";

import { Alert as AlertType, useAlert } from "@/contexts/AlertContext";
import { useState } from "react";

const alertStyles = {
	success: "bg-green-500",
	error: "bg-red-500",
	warning: "bg-yellow-500",
	info: "bg-blue-500"
};

function AlertItem({ alert }: { alert: AlertType }) {
	const { hideAlert } = useAlert();
	const [isExiting, setIsExiting] = useState(false);

	const handleClose = () => {
		setIsExiting(true);
		setTimeout(() => hideAlert(alert.id), 300);
	};

	return (
		<div
			className={`${alertStyles[alert.type]} w-full h-12 items-center justify-between flex text-xl text-white transition-all duration-300 ${isExiting ? "opacity-0 translate-y-2" : "opacity-100"}`}
			style={{
				paddingLeft: "1rem",
				paddingRight: "1rem"
			}}
		>
			<p>{alert.message}</p>
			<button onClick={handleClose} className="hover:opacity-70 transition-opacity cursor-pointer" aria-label="Close alert">
				✕
			</button>
		</div>
	);
}

export function AlertContainer() {
	const { alerts } = useAlert();

	if (alerts.length === 0) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col-reverse gap-2 pb-2">
			{alerts.map(alert => (
				<AlertItem key={alert.id} alert={alert} />
			))}
		</div>
	);
}
