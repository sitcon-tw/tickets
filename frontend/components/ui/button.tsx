import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import Spinner from "@/components/Spinner";
import { buttonVariants } from "@/components/ui/button-variants";
import { ButtonProps } from "@/lib/types/components";
import { cn } from "@/lib/utils";

function Button({ className, variant, size, asChild = false, isLoading = false, children, disabled, ref, ...props }: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || isLoading} {...props}>
			{isLoading ? (
				<>
					<Spinner size="sm" className="mr-2" />
					{children}
				</>
			) : (
				children
			)}
		</Comp>
	);
}

export { Button };
