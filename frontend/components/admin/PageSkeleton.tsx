import { cn } from "@/lib/utils";

/**
 * Generic loading placeholder for an admin page body, e.g. while waiting for hydration
 * (the selected event lives in localStorage, so it is unknown during SSR).
 */
export function PageSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
	return (
		<div aria-busy="true" className={cn("space-y-3 rounded-xl border bg-card p-4", className)}>
			{Array.from({ length: rows }, (_, index) => (
				<div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
			))}
		</div>
	);
}
