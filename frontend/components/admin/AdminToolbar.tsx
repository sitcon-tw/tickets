import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AdminToolbarProps = {
	children: ReactNode;
	className?: string;
};

/** Wrapping row for search boxes, filters and bulk actions above a table. */
export function AdminToolbar({ children, className }: AdminToolbarProps) {
	return <div className={cn("mb-4 flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

/** Pushes its children to the right end of an <AdminToolbar>. */
export function AdminToolbarSpacer() {
	return <div className="hidden flex-1 sm:block" />;
}
