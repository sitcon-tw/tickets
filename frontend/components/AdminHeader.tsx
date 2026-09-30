import { AdminHeaderProps } from "@/lib/types/components";

export default function AdminHeader({ title, description, actions }: AdminHeaderProps) {
	return (
		<header className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b pb-5">
			<div className="min-w-0">
				<h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
				{description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
		</header>
	);
}
