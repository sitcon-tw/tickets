import { cn } from "@/lib/utils";

interface ProgressProps {
	value?: number;
	className?: string;
}

export function Progress({ value = 0, className }: ProgressProps) {
	const pct = Math.max(0, Math.min(100, value));
	return (
		<div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
			<div className="h-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
		</div>
	);
}
