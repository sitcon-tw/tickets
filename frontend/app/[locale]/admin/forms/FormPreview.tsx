"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { FormField } from "@/components/form/FormField";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FormDataType } from "@/lib/types/data";
import { getLocalizedText } from "@/lib/utils/localization";
import { getVisibleFieldIds, type Ticket } from "@sitcontix/types";
import { ClipboardList, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { questionToEventFormField, type Question } from "./types";

type FormPreviewProps = {
	eventId: string;
	questions: Question[];
	eventTickets: Ticket[];
	locale: string;
	t: Record<string, string>;
};

/** Renders the form with the same components the registration page uses, applying the display conditions. */
export function FormPreview({ eventId, questions, eventTickets, locale, t }: FormPreviewProps) {
	const [formData, setFormData] = useState<FormDataType>({});
	const [ticketId, setTicketId] = useState("");
	const selectedTicketId = ticketId || eventTickets[0]?.id || "";

	const fields = useMemo(() => questions.map((q, index) => questionToEventFormField(q, eventId, index)), [questions, eventId]);
	const visibleIds = getVisibleFieldIds(fields, { ticketId: selectedTicketId, formData, now: new Date() });
	const visible = fields.filter(field => visibleIds.has(field.id));
	const hiddenCount = fields.length - visible.length;

	function handleValueChange(fieldId: string, value: string | boolean | string[]) {
		setFormData(prev => ({ ...prev, [fieldId]: value }));
	}

	if (questions.length === 0) {
		return <EmptyState icon={ClipboardList} title={t.previewEmpty} description={t.previewEmptyHelp} />;
	}

	return (
		<div className="mx-auto max-w-2xl space-y-5">
			<div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-end sm:justify-between">
				<p className="max-w-sm text-sm text-muted-foreground">{t.previewHelp}</p>
				{eventTickets.length > 0 && (
					<div className="sm:w-56">
						<Label htmlFor="preview-ticket" className="mb-1.5 text-xs font-medium text-muted-foreground">
							{t.previewTicket}
						</Label>
						<Select value={selectedTicketId} onValueChange={setTicketId}>
							<SelectTrigger id="preview-ticket" className="h-9 w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{eventTickets.map(ticket => (
									<SelectItem key={ticket.id} value={ticket.id}>
										{getLocalizedText(ticket.name, locale)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>

			<div className="space-y-6 rounded-xl border bg-card p-5 sm:p-6">
				{visible.map(field => (
					<FormField key={field.id} field={field} value={formData[field.id]} onValueChange={handleValueChange} pleaseSelectText={t.pleaseSelect} />
				))}
				{visible.length === 0 && <p className="text-center text-sm text-muted-foreground">{t.previewAllHidden}</p>}
			</div>

			{hiddenCount > 0 && (
				<p className="flex items-center gap-2 text-sm text-muted-foreground">
					<EyeOff className="size-4" />
					{t.previewHidden.replace("{count}", String(hiddenCount))}
				</p>
			)}
		</div>
	);
}
