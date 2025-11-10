import * as React from "react";
import { cn } from "@/lib/utils";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
	return (
		<span
			className={cn(
				"absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
				className
			)}
			style={{
				clip: "rect(0, 0, 0, 0)",
				clipPath: "inset(50%)",
			}}
			{...props}
		/>
	);
}
