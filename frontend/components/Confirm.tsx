"use client";

import { Button } from "@/components/ui/button";
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
		<Dialog open={isOpen && isConfirming} onOpenChange={open => !open && onClose()}>
			<DialogOverlay className="backdrop-blur-lg" />
			<DialogContent className="max-w-[800px] w-full max-h-[90vh] overflow-y-auto p-0 gap-0" onPointerDownOutside={onClose}>
				<Button type="button" variant="ghost" size="icon" aria-label="close" onClick={onClose} className="absolute right-2 top-2 z-10">
					<X className="h-6 w-6" />
				</Button>
				<div className={isConfirming ? "confirming" : ""}>{children}</div>
			</DialogContent>
		</Dialog>
	);
}
