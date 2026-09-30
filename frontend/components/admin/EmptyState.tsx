import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: LucideIcon;
	/** Optional call-to-action, e.g. a Button. */
	action?: ReactNode;
	className?: string;
};

/** Friendly placeholder for empty lists and "nothing selected" screens. */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
	return (
		<div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center", className)}>
			<div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<Icon className="size-6" />
			</div>
			<div className="space-y-1">
				<p className="font-medium">{title}</p>
				{description && <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>}
			</div>
			{action}
		</div>
	);
}
