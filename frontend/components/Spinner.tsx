import { cn } from "@/lib/utils";

interface SpinnerProps {
	size?: "sm" | "md" | "lg";
	className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
	const sizeClasses = {
		sm: "w-4 h-4 border-2",
		md: "w-6 h-6 border-2",
		lg: "w-8 h-8 border-3"
	};

	return (
		<div
			className={cn(
				"inline-block rounded-full border-transparent border-t-current animate-spin",
				sizeClasses[size],
				className
			)}
			role="status"
			aria-label="Loading"
		/>
	);
}
