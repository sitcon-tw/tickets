import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { badgeVariants, type BadgeVariantProps } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & BadgeVariantProps & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
