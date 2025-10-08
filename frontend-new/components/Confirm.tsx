"use client";

import { ReactNode } from "react";

type ConfirmProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	isConfirming?: boolean;
};

export default function Confirm({ isOpen, onClose, children, isConfirming = false }: ConfirmProps) {
	return (
		<div
			className={isConfirming ? "confirm confirming" : "confirm"}
			role="dialog"
			aria-modal="true"
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				backgroundColor: "#00000029",
				backdropFilter: "blur(20px)",
				WebkitBackdropFilter: "blur(20px)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "2rem",
				opacity: isOpen && isConfirming ? 1 : 0,
				pointerEvents: isOpen && isConfirming ? "all" : "none",
				transition: "opacity 0.3s ease-in-out",
				zIndex: 1001,
				overflowY: "auto"
			}}
		>
			<div
				style={{
					maxWidth: "800px",
					width: "100%",
					maxHeight: "90vh",
					display: "flex",
					flexDirection: "column",
					position: "relative"
				}}
			>
				<button
					type="button"
					aria-label="close"
					onClick={onClose}
					style={{
						position: "absolute",
						right: "0.5rem",
						top: "0.5rem",
						cursor: "pointer",
						fontSize: "2rem",
						background: "transparent",
						border: "none",
						color: "inherit",
						lineHeight: 1,
						zIndex: 10
					}}
				>
					×
				</button>
				{children}
			</div>
		</div>
	);
}
