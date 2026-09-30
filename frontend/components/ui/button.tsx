import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import Spinner from "@/components/Spinner";
import { buttonVariants } from "@/components/ui/button-variants";
import { ButtonProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";

function Button({ className, variant, size, asChild = false, isLoading = false, children, disabled, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const Comp = asChild ? Slot : "button";
	// Slot needs exactly one child, so the spinner is only injected into a real <button>.
	const showSpinner = isLoading && !asChild;
	return (
		<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || isLoading} aria-busy={isLoading || undefined} data-loading={isLoading || undefined} {...props}>
			{showSpinner && (
				<span aria-hidden="true" className="contents">
					<Spinner size="sm" />
				</span>
			)}
			{/* An icon-only button has no room for a spinner plus its icon, so the spinner replaces it. */}
			{showSpinner && size === "icon" ? null : children}
		</Comp>
	);
}

export { Button };
