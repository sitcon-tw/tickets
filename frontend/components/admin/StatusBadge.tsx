import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<StatusTone, { badge: string; dot: string }> = {
	success: { badge: "bg-green-500/10 text-green-700 ring-green-600/20 dark:text-green-400 dark:ring-green-400/20", dot: "bg-green-500" },
	warning: { badge: "bg-amber-500/10 text-amber-700 ring-amber-600/20 dark:text-amber-400 dark:ring-amber-400/20", dot: "bg-amber-500" },
	danger: { badge: "bg-red-500/10 text-red-700 ring-red-600/20 dark:text-red-400 dark:ring-red-400/20", dot: "bg-red-500" },
	info: { badge: "bg-blue-500/10 text-blue-700 ring-blue-600/20 dark:text-blue-400 dark:ring-blue-400/20", dot: "bg-blue-500" },
	neutral: { badge: "bg-gray-500/10 text-gray-700 ring-gray-600/20 dark:text-gray-300 dark:ring-gray-400/20", dot: "bg-gray-400" }
};

type StatusBadgeProps = {
	tone?: StatusTone;
	children: ReactNode;
	/** Hide the leading colored dot. */
	noDot?: boolean;
	className?: string;
};

/** Small pill used for every status / role / state label in the admin UI. */
export function StatusBadge({ tone = "neutral", children, noDot = false, className }: StatusBadgeProps) {
	const classes = toneClasses[tone];
	return (
		<span className={cn("inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", classes.badge, className)}>
			{!noDot && <span aria-hidden="true" className={cn("size-1.5 rounded-full", classes.dot)} />}
			{children}
		</span>
	);
}
