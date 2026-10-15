"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { getTranslations } from "@/i18n/helpers";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { ReactNode } from "react";

type ConfirmProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	isConfirming?: boolean;
};

export default function Confirm({ isOpen, onClose, children, isConfirming = false }: ConfirmProps) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		title: { "zh-Hant": "確認票券", en: "Ticket Confirmation" },
		close: { "zh-Hant": "關閉", en: "Close" }
	});

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogOverlay className="backdrop-blur-lg" />
			{/* On phones the box is pushed down by mt-20 to clear the nav, so it has 5rem less height to fit in */}
			<DialogContent
				className="max-w-[900px] w-full max-h-[calc(90dvh-5rem)] md:max-h-[90vh] overflow-y-auto p-0 gap-0 mt-20 md:mt-0 data-[state=open]:zoom-in-100"
				onPointerDownOutside={onClose}
				showCloseButton={false}
			>
				<VisuallyHidden>
					<DialogTitle>{t.title}</DialogTitle>
				</VisuallyHidden>
				<Button type="button" variant="ghost" size="icon" aria-label={t.close} onClick={onClose} className="absolute right-2 top-2 z-10">
					<X className="h-6 w-6" />
				</Button>
				<div className={isConfirming ? "confirming" : ""}>{children}</div>
			</DialogContent>
		</Dialog>
	);
}
