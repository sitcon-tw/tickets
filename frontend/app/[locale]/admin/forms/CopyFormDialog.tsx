"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Event } from "@sitcontix/types";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

type CopyFormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	events: Event[];
	locale: string;
	hasExistingFields: boolean;
	t: Record<string, string>;
	/** Resolves when the copy finished; rejects (dialog stays open) when it failed. */
	onCopy: (sourceEventId: string) => Promise<void>;
};

export function CopyFormDialog({ open, onOpenChange, events, locale, hasExistingFields, t, onCopy }: CopyFormDialogProps) {
	const [sourceId, setSourceId] = useState("");
	const [isCopying, setIsCopying] = useState(false);

	function handleOpenChange(next: boolean) {
		if (isCopying) return;
		if (!next) setSourceId("");
		onOpenChange(next);
	}

	async function handleCopy() {
		if (!sourceId || isCopying) return;
		setIsCopying(true);
		try {
			await onCopy(sourceId);
			setSourceId("");
			onOpenChange(false);
		} catch {
			// The parent already reported the error; keep the dialog open so the selection is not lost.
		} finally {
			setIsCopying(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{t.copyFrom}</DialogTitle>
					<DialogDescription>{t.copyDescription}</DialogDescription>
				</DialogHeader>

				<div className="space-y-2">
					<Label htmlFor="copy-source-event" className="text-sm font-medium">
						{t.copySourceEvent}
					</Label>
					<Select value={sourceId} onValueChange={setSourceId}>
						<SelectTrigger id="copy-source-event" className="w-full">
							<SelectValue placeholder={t.selectEvent} />
						</SelectTrigger>
						<SelectContent>
							{events.map(event => (
								<SelectItem key={event.id} value={event.id}>
									{getLocalizedText(event.name, locale) || event.id}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{events.length === 0 && <p className="text-sm text-muted-foreground">{t.noOtherEvents}</p>}
				</div>

				{hasExistingFields && (
					<div role="alert" className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
						<AlertTriangle className="mt-0.5 size-4 shrink-0" />
						<p>{t.copyReplaceWarning}</p>
					</div>
				)}
				<p className="text-xs text-muted-foreground">{t.copyConditionsNote}</p>

				<DialogFooter>
					<Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isCopying}>
						{t.cancel}
					</Button>
					<Button type="button" variant={hasExistingFields ? "destructive" : "primary"} onClick={handleCopy} disabled={!sourceId} isLoading={isCopying}>
						{t.copyAction}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
