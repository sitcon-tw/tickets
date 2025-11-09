"use client";

import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";

type ConfirmProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	isConfirming?: boolean;
};

export default function Confirm({ isOpen, onClose, children, isConfirming = false }: ConfirmProps) {
	return (
		<Dialog open={isOpen && isConfirming} onOpenChange={(open) => !open && onClose()}>
			<DialogOverlay className="backdrop-blur-lg" />
			<DialogContent 
				className="max-w-[800px] w-full max-h-[90vh] overflow-y-auto p-0 gap-0"
				onPointerDownOutside={onClose}
			>
				<button
					type="button"
					aria-label="close"
					onClick={onClose}
					className="absolute right-2 top-2 z-10 cursor-pointer text-4xl bg-transparent border-none text-foreground leading-none hover:opacity-70 transition-opacity"
				>
					<X className="h-6 w-6" />
				</button>
				<div className={isConfirming ? "confirming" : ""}>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
