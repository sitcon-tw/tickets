import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import Spinner from "@/components/Spinner";
import { buttonVariants } from "@/components/ui/button-variants";
import { ButtonProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";

function Button({ className, variant, size, asChild = false, isLoading = false, children, disabled, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const classes = cn(buttonVariants({ variant, size, className }));
	const stateProps = { disabled: disabled || isLoading, "aria-busy": isLoading || undefined, "data-loading": isLoading || undefined };

	// Slot needs exactly one element child (even `false` siblings break it), so the spinner is only injected into a real <button>.
	if (asChild) {
		return (
			<Slot className={classes} ref={ref} {...stateProps} {...props}>
				{children}
			</Slot>
		);
	}

	return (
		<button className={classes} ref={ref} {...stateProps} {...props}>
			{isLoading && (
				<span aria-hidden="true" className="contents">
					<Spinner size="sm" />
				</span>
			)}
			{/* An icon-only button has no room for a spinner plus its icon, so the spinner replaces it. */}
			{isLoading && size === "icon" ? null : children}
		</button>
	);
}

export { Button };
