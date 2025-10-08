import { CSSProperties } from "react";

interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	color?: string;
	style?: CSSProperties;
}

export default function Spinner({ size = "md", color = "currentColor", style }: SpinnerProps) {
	const sizes = {
		sm: "16px",
		md: "24px",
		lg: "32px"
	};

	return (
		<div
			style={{
				display: "inline-block",
				width: sizes[size],
				height: sizes[size],
				border: `2px solid transparent`,
				borderTopColor: color,
				borderRadius: "50%",
				animation: "spin 0.8s linear infinite",
				...style
			}}
			role="status"
			aria-label="Loading"
		>
			<style jsx>{`
				@keyframes spin {
					to {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	);
}
