import { cva } from "class-variance-authority";

export const buttonVariants = cva(
	"inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "border-2 border-gray-300 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-black dark:text-white",
				outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline"
			},
			size: {
				default: "h-11 px-5 py-2 text-md",
				sm: "h-9 px-3 text-sm",
				lg: "h-12 px-6 text-xl",
				icon: "h-10 w-10"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	}
);
