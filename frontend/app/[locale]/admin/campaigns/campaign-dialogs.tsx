"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getLocalizedText } from "@/lib/utils/localization";
import type { Ticket } from "@sitcontix/types";
import { FileText, Users } from "lucide-react";
import type { Dispatch, RefObject } from "react";
import type { AudienceListField, CampaignsAction, CampaignsState, CreateTab, PreviewTab, Template } from "./state";
import type { CampaignTranslations } from "./translations";

const TEMPLATE_VARIABLES: Array<{ key: string; label: string; category: string }> = [
	{ key: "{{email}}", label: "varEmail", category: "identity" },
	{ key: "{{name}}", label: "varName", category: "identity" },
	{ key: "{{eventName}}", label: "varEventName", category: "event" },
	{ key: "{{eventDate}}", label: "varEventDate", category: "event" },
	{ key: "{{eventEndDate}}", label: "varEventEndDate", category: "event" },
	{ key: "{{eventLocation}}", label: "varEventLocation", category: "event" },
	{ key: "{{ticketName}}", label: "varTicketName", category: "ticket" },
	{ key: "{{ticketPrice}}", label: "varTicketPrice", category: "ticket" },
	{ key: "{{registrationId}}", label: "varRegistrationId", category: "registration" }
];

const VARIABLE_CATEGORY_COLORS: Record<string, string> = {
	identity: "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-300",
	event: "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-300",
	ticket: "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300",
	registration: "bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-300"
};

const REGISTRATION_STATUSES = ["confirmed", "pending", "cancelled"] as const;

type CampaignDialogsProps = {
	state: CampaignsState;
	contentRef: RefObject<HTMLTextAreaElement | null>;
	visibleTickets: Ticket[];
	locale: string;
	t: CampaignTranslations;
	dispatch: Dispatch<CampaignsAction>;
	toggleCheckbox: (field: AudienceListField, id: string, checked: boolean) => void;
	insertVariable: (variable: string) => void;
	handlePreviewRecipients: () => void;
	handleCreate: () => void;
	handleImportTemplate: (template: Template) => void;
};

function RecipientRows({ recipients, emptyText }: { recipients: { id: string; email: string }[]; emptyText: string }) {
	if (recipients.length === 0) return <p className="p-4 text-sm text-muted-foreground">{emptyText}</p>;
	return (
		<ul className="space-y-0.5 p-1">
			{recipients.map((r, i) => (
				<li key={r.id} className="flex items-center gap-3 rounded px-3 py-1.5 text-sm hover:bg-muted">
					<span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">{i + 1}</span>
					<span className="break-all font-mono">{r.email}</span>
				</li>
			))}
		</ul>
	);
}

export function CampaignDialogs({
	state,
	contentRef,
	visibleTickets,
	locale,
	t,
	dispatch,
	toggleCheckbox,
	insertVariable,
	handlePreviewRecipients,
	handleCreate,
	handleImportTemplate
}: CampaignDialogsProps) {
	const {
		showCreateModal,
		createTab,
		formData,
		recipientCount,
		recipientList,
		isCalculating,
		isSaving,
		showPreviewModal,
		selectedCampaign,
		previewHtml,
		previewRecipients,
		previewTab,
		showRecipientsModal,
		showTemplateModal,
		templates,
		events
	} = state;

	return (
		<>
			{/* Create campaign */}
			<Dialog open={showCreateModal} onOpenChange={value => dispatch({ type: "setCreateModal", value })}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
					<DialogHeader>
						<DialogTitle>{t.createNew}</DialogTitle>
						<DialogDescription>{t.description}</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-5">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="campaign-name">
									{t.name} <span className="text-destructive">*</span>
								</Label>
								<Input id="campaign-name" required value={formData.name} onChange={e => dispatch({ type: "setFormField", field: "name", value: e.target.value })} placeholder={t.namePlaceholder} />
								<p className="text-xs text-muted-foreground">{t.nameHelp}</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="campaign-subject">
									{t.subject} <span className="text-destructive">*</span>
								</Label>
								<Input
									id="campaign-subject"
									required
									value={formData.subject}
									onChange={e => dispatch({ type: "setFormField", field: "subject", value: e.target.value })}
									placeholder={t.subjectPlaceholder}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<Label htmlFor="campaign-content">
									{t.content} <span className="text-destructive">*</span>
								</Label>
								<Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "setTemplateModal", value: true })}>
									<FileText className="size-4" />
									{t.importTemplate}
								</Button>
							</div>
							<Tabs value={createTab} onValueChange={value => dispatch({ type: "setCreateTab", value: value as CreateTab })}>
								<TabsList>
									<TabsTrigger value="edit">{t.edit}</TabsTrigger>
									<TabsTrigger value="preview">{t.contentPreview}</TabsTrigger>
								</TabsList>
								<TabsContent value="edit" className="space-y-3">
									<Textarea
										id="campaign-content"
										ref={contentRef}
										required
										value={formData.content}
										onChange={e => dispatch({ type: "setFormField", field: "content", value: e.target.value })}
										className="min-h-[220px] font-mono text-sm"
										placeholder="<h1>Hello {{name}}!</h1>"
									/>
									<div className="space-y-1.5">
										<p className="text-xs text-muted-foreground">{t.insertVar}</p>
										<div className="flex flex-wrap gap-1.5">
											{TEMPLATE_VARIABLES.map(v => (
												<button
													key={v.key}
													type="button"
													title={t[v.label]}
													onClick={() => insertVariable(v.key)}
													className={`inline-flex cursor-pointer items-center rounded px-2 py-0.5 font-mono text-xs transition-colors ${VARIABLE_CATEGORY_COLORS[v.category]}`}
												>
													{v.key}
												</button>
											))}
										</div>
									</div>
								</TabsContent>
								<TabsContent value="preview" className="space-y-2">
									<p className="text-xs text-muted-foreground">{t.contentPreviewHint}</p>
									{formData.content.trim() ? (
										<div className="overflow-hidden rounded-lg border bg-white">
											<iframe title={t.contentPreview} srcDoc={formData.content} sandbox="" referrerPolicy="no-referrer" className="h-[320px] w-full border-0" />
										</div>
									) : (
										<p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{t.contentEmpty}</p>
									)}
								</TabsContent>
							</Tabs>
						</div>

						{/* Target audience */}
						<fieldset className="space-y-4 rounded-xl border bg-card p-4">
							<legend className="px-1 text-sm font-semibold">{t.targetAudience}</legend>

							<div className="space-y-1.5">
								<Label className="text-sm text-muted-foreground">{t.selectEvents}</Label>
								<div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-3">
									{events.map(event => (
										<Label key={event.id} className="flex cursor-pointer items-center gap-2 font-normal">
											<Checkbox checked={formData.targetAudience.eventIds.includes(event.id)} onCheckedChange={checked => toggleCheckbox("eventIds", event.id, !!checked)} />
											<span className="text-sm">{getLocalizedText(event.name, locale)}</span>
										</Label>
									))}
									{events.length === 0 && <p className="text-sm text-muted-foreground">{t.noEvents}</p>}
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="text-sm text-muted-foreground">{t.selectTickets}</Label>
								<div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-3">
									{visibleTickets.map(ticket => (
										<Label key={ticket.id} className="flex cursor-pointer items-center gap-2 font-normal">
											<Checkbox checked={formData.targetAudience.ticketIds.includes(ticket.id)} onCheckedChange={checked => toggleCheckbox("ticketIds", ticket.id, !!checked)} />
											<span className="text-sm">{getLocalizedText(ticket.name, locale)}</span>
										</Label>
									))}
									{visibleTickets.length === 0 && <p className="text-sm text-muted-foreground">{formData.targetAudience.eventIds.length > 0 ? t.noTicketsForEvents : t.noTickets}</p>}
								</div>
							</div>

							<div className="space-y-1.5">
								<Label className="text-sm text-muted-foreground">{t.registrationStatusFilter}</Label>
								<div className="flex flex-wrap gap-4">
									{REGISTRATION_STATUSES.map(status => (
										<Label key={status} className="flex cursor-pointer items-center gap-2 font-normal">
											<Checkbox checked={formData.targetAudience.registrationStatuses.includes(status)} onCheckedChange={checked => toggleCheckbox("registrationStatuses", status, !!checked)} />
											{t[status]}
										</Label>
									))}
								</div>
							</div>
						</fieldset>

						{/* Recipient preview result */}
						{recipientCount !== null && (
							<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3" role="status">
								<div className="space-y-0.5">
									<div className="flex items-center gap-2">
										<Users className="size-4" />
										<span className="font-medium">{t.recipientCountLabel}</span>
										<Badge variant="secondary" className="px-3 text-base">
											{recipientCount}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground">{t.recipientCountHint}</p>
								</div>
								{recipientList.length > 0 && (
									<Button type="button" variant="outline" size="sm" onClick={() => dispatch({ type: "setRecipientsModal", value: true })}>
										{t.viewRecipients}
									</Button>
								)}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => dispatch({ type: "setCreateModal", value: false })}>
							{t.close}
						</Button>
						<Button type="button" variant="outline" onClick={handlePreviewRecipients} isLoading={isCalculating}>
							{!isCalculating && <Users className="size-4" />}
							{t.previewRecipients}
						</Button>
						<Button type="button" onClick={handleCreate} isLoading={isSaving}>
							{t.save}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Preview an existing campaign */}
			<Dialog open={showPreviewModal} onOpenChange={value => dispatch({ type: "setPreviewModal", value })}>
				<DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle className="pr-6 leading-snug">
							{t.preview}: {selectedCampaign?.subject}
						</DialogTitle>
						<DialogDescription>{selectedCampaign?.name}</DialogDescription>
					</DialogHeader>

					<Tabs value={previewTab} onValueChange={value => dispatch({ type: "setPreviewTab", value: value as PreviewTab })} className="min-h-0 flex-1">
						<TabsList>
							<TabsTrigger value="html">{t.emailPreview}</TabsTrigger>
							<TabsTrigger value="recipients">
								<Users />
								{t.recipientList}
								<Badge variant="secondary" className="px-1.5 py-0 text-xs">
									{previewRecipients.length}
								</Badge>
							</TabsTrigger>
						</TabsList>
						<TabsContent value="html" className="min-h-0 overflow-auto rounded-lg border bg-white">
							<iframe title={selectedCampaign?.subject || t.preview} srcDoc={previewHtml} sandbox="" referrerPolicy="no-referrer" className="h-[55vh] w-full border-0" />
						</TabsContent>
						<TabsContent value="recipients" className="max-h-[55vh] min-h-0 overflow-auto rounded-lg border">
							<RecipientRows recipients={previewRecipients} emptyText={t.noMatchingRecipients} />
						</TabsContent>
					</Tabs>

					<DialogFooter>
						<Button type="button" variant="secondary" onClick={() => dispatch({ type: "setPreviewModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Recipients of the campaign being composed */}
			<Dialog open={showRecipientsModal} onOpenChange={value => dispatch({ type: "setRecipientsModal", value })}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{t.recipientCountLabel} ({recipientCount ?? 0})
						</DialogTitle>
						<DialogDescription>{t.recipientCountHint}</DialogDescription>
					</DialogHeader>
					<div className="max-h-[60vh] overflow-y-auto rounded-lg border">
						<RecipientRows recipients={recipientList} emptyText={t.noMatchingRecipients} />
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={() => dispatch({ type: "setRecipientsModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Template import */}
			<Dialog open={showTemplateModal} onOpenChange={value => dispatch({ type: "setTemplateModal", value })}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>{t.templates}</DialogTitle>
						<DialogDescription>{t.importTemplateOverwrite}</DialogDescription>
					</DialogHeader>
					<div className="max-h-[60vh] space-y-3 overflow-y-auto">
						{templates.map(tpl => (
							<div key={tpl.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
								<div className="min-w-0">
									<p className="font-medium">{tpl.name}</p>
									{tpl.description && <p className="text-sm text-muted-foreground">{tpl.description}</p>}
								</div>
								<Button type="button" size="sm" variant="outline" onClick={() => handleImportTemplate(tpl)}>
									{t.importTemplate}
								</Button>
							</div>
						))}
						{templates.length === 0 && <p className="text-sm text-muted-foreground">{t.noTemplates}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={() => dispatch({ type: "setTemplateModal", value: false })}>
							{t.close}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
