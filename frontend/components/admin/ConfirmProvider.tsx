"use client";

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/i18n/helpers";
import { useLocale } from "next-intl";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export type ConfirmOptions = {
	title: string;
	description?: ReactNode;
	/** Label for the confirm button. Defaults to a localized "Confirm" ("Delete" when destructive). */
	confirmLabel?: string;
	cancelLabel?: string;
	/** Styles the confirm button as destructive. */
	destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Promise-based replacement for window.confirm().
 *
 * @example
 * const confirm = useConfirm();
 * if (!(await confirm({ title: t.deleteTitle, description: t.deleteConfirm, destructive: true }))) return;
 */
export function useConfirm(): ConfirmFn {
	const confirm = useContext(ConfirmContext);
	if (!confirm) throw new Error("useConfirm must be used within <ConfirmProvider>");
	return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
	const locale = useLocale();
	const t = getTranslations(locale, {
		confirm: { "zh-Hant": "確認", "zh-Hans": "确认", en: "Confirm" },
		delete: { "zh-Hant": "刪除", "zh-Hans": "删除", en: "Delete" },
		cancel: { "zh-Hant": "取消", "zh-Hans": "取消", en: "Cancel" }
	});

	const [options, setOptions] = useState<ConfirmOptions | null>(null);
	const [open, setOpen] = useState(false);
	const resolverRef = useRef<((value: boolean) => void) | null>(null);

	const confirm = useCallback<ConfirmFn>(opts => {
		// A new request while one is pending cancels the old one.
		resolverRef.current?.(false);
		setOptions(opts);
		setOpen(true);
		return new Promise<boolean>(resolve => {
			resolverRef.current = resolve;
		});
	}, []);

	const settle = useCallback((value: boolean) => {
		resolverRef.current?.(value);
		resolverRef.current = null;
		setOpen(false);
	}, []);

	return (
		<ConfirmContext value={confirm}>
			{children}
			<AlertDialog open={open} onOpenChange={next => !next && settle(false)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{options?.title}</AlertDialogTitle>
						{options?.description && <AlertDialogDescription>{options.description}</AlertDialogDescription>}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<Button type="button" variant="secondary" onClick={() => settle(false)}>
							{options?.cancelLabel ?? t.cancel}
						</Button>
						<Button type="button" variant={options?.destructive ? "destructive" : "primary"} onClick={() => settle(true)} autoFocus>
							{options?.confirmLabel ?? (options?.destructive ? t.delete : t.confirm)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmContext>
	);
}
