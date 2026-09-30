import { cva } from "class-variance-authority";

export const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,transform,filter] duration-150 outline-none active:scale-[0.96] active:shadow-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 hover:border-gray-400 active:bg-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500 dark:active:bg-gray-500 text-gray-900 dark:text-white shadow-xs",
				outline:
					"border border-input bg-background shadow-xs hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 dark:bg-input/30 dark:hover:bg-input/70 dark:hover:border-gray-500 dark:active:bg-input",
				primary: "bg-primary text-primary-foreground shadow-xs hover:brightness-125 hover:shadow-md active:brightness-90",
				destructive: "bg-destructive text-destructive-foreground shadow-xs hover:brightness-110 hover:shadow-md active:brightness-90",
				secondary: "bg-secondary text-secondary-foreground hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
				ghost: "hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-gray-700 dark:active:bg-gray-600",
				link: "text-primary underline-offset-4 hover:underline active:opacity-70 active:scale-100"
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3 text-sm pointer-coarse:h-10",
				lg: "h-12 px-6 text-base",
				icon: "size-10"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	}
);
