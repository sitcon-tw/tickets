"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { useConfirm } from "@/components/admin/ConfirmProvider";
import AdminHeader from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/contexts/AlertContext";
import { Link } from "@/i18n/navigation";
import { adminEventFormFieldsAPI, adminEventsAPI, adminTicketsAPI } from "@/lib/api/endpoints";
import { useSelectedEventId } from "@/lib/hooks/useSelectedEventId";
import { AlertCircle, CalendarDays, ClipboardList, Copy, MousePointerClick, Plus, Save, Trash2 } from "lucide-react";
import { useLocale } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { CopyFormDialog } from "./CopyFormDialog";
import { FieldEditor } from "./FieldEditor";
import { FieldList } from "./FieldList";
import { FormPreview } from "./FormPreview";
import { useMediaQuery, useUnsavedChangesGuard } from "./hooks";
import { formsReducer, initialFormsState, remapFilters, snapshotQuestions } from "./state";
import { COPY_SUFFIX, NEW_FIELD_NAMES, useFormsTranslations } from "./translations";
import {
	buildFieldData,
	copyFieldsToQuestions,
	createBlankQuestion,
	duplicateQuestion,
	fieldToQuestion,
	getQuestionTitle,
	isTempId,
	serializeFilters,
	validateQuestions,
	type Question
} from "./types";

type ServerState = { ids: string[]; orders: Map<string, number>; maxOrder: number };

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function assertOk<T extends { success: boolean; message?: string }>(response: T): T {
	if (!response.success) throw new Error(response.message || "Request failed");
	return response;
}

export default function FormsPage() {
	const locale = useLocale();
	const t = useFormsTranslations(locale);
	const { showAlert } = useAlert();
	const confirm = useConfirm();
	const currentEventId = useSelectedEventId();
	const isWide = useMediaQuery("(min-width: 1280px)", true);

	const [state, dispatch] = useReducer(formsReducer, initialFormsState);
	const { questions, baseline, selectedId, eventTickets, allEvents, isLoading, loadError, isSaving } = state;
	const [view, setView] = useState<"builder" | "preview">("builder");
	const [editorOpen, setEditorOpen] = useState(false);
	const [copyOpen, setCopyOpen] = useState(false);

	const eventIdRef = useRef(currentEventId);
	const notifyRef = useRef({ showAlert, loadFailed: t.loadFailed });
	useEffect(() => {
		notifyRef.current = { showAlert, loadFailed: t.loadFailed };
	});
	const serverRef = useRef<ServerState>({ ids: [], orders: new Map(), maxOrder: -1 });

	const messages = useMemo(
		() => ({
			nameRequired: t.issueNameRequired,
			nameDuplicate: t.issueNameDuplicate,
			optionsRequired: t.issueOptionsRequired,
			optionNameRequired: t.issueOptionNameRequired,
			optionDuplicate: t.issueOptionDuplicate,
			regexInvalid: t.issueRegexInvalid,
			filterNoConditions: t.issueFilterNoConditions,
			conditionNoTicket: t.issueConditionNoTicket,
			conditionNoField: t.issueConditionNoField,
			conditionMissingField: t.issueConditionMissingField,
			conditionNoValue: t.issueConditionNoValue,
			conditionNoTime: t.issueConditionNoTime,
			conditionTimeOrder: t.issueConditionTimeOrder,
			conditionCircular: t.issueConditionCircular
		}),
		[t]
	);
	const issues = useMemo(() => validateQuestions(questions, messages), [questions, messages]);
	const isDirty = useMemo(() => !isLoading && snapshotQuestions(questions) !== baseline, [questions, baseline, isLoading]);
	const selected = questions.find(q => q.id === selectedId) ?? null;

	useUnsavedChangesGuard(isDirty, () => confirm({ title: t.leaveTitle, description: t.leaveDescription, confirmLabel: t.leaveConfirm, destructive: true }));

	const loadFields = useCallback(async (eventId: string) => {
		try {
			const response = assertOk(await adminEventFormFieldsAPI.getAll({ eventId }));
			if (eventIdRef.current !== eventId) return;
			const fields = [...(response.data || [])].sort((a, b) => a.order - b.order);
			serverRef.current = { ids: fields.map(f => f.id), orders: new Map(fields.map(f => [f.id, f.order])), maxOrder: fields.reduce((max, f) => Math.max(max, f.order), -1) };
			dispatch({ type: "loadSucceeded", questions: fields.map(field => fieldToQuestion(field)) });
		} catch (error) {
			if (eventIdRef.current !== eventId) return;
			console.error("Failed to load form fields:", error);
			dispatch({ type: "loadFailed", message: errorMessage(error) });
		}
	}, []);

	useEffect(() => {
		eventIdRef.current = currentEventId;
		if (!currentEventId) return;

		dispatch({ type: "loadStarted" });
		setView("builder");
		setEditorOpen(false);
		void loadFields(currentEventId);
		adminTicketsAPI
			.getAll({ eventId: currentEventId })
			.then(response => {
				if (eventIdRef.current === currentEventId && response.success) dispatch({ type: "ticketsLoaded", tickets: response.data || [] });
			})
			.catch(error => {
				console.error("Failed to load tickets:", error);
				if (eventIdRef.current === currentEventId) notifyRef.current.showAlert(notifyRef.current.loadFailed + ": " + errorMessage(error), "error");
			});
	}, [currentEventId, loadFields]);

	useEffect(() => {
		let cancelled = false;
		adminEventsAPI
			.getAll()
			.then(response => {
				if (!cancelled && response.success) dispatch({ type: "eventsLoaded", events: response.data || [] });
			})
			.catch(error => console.error("Failed to load events:", error));
		return () => {
			cancelled = true;
		};
	}, []);

	const otherEvents = useMemo(() => allEvents.filter(event => event.id !== currentEventId), [allEvents, currentEventId]);

	const updateQuestion = useCallback((id: string, updates: Partial<Question>) => dispatch({ type: "updateQuestion", id, updates }), []);

	function selectQuestion(id: string) {
		dispatch({ type: "select", id });
		if (!isWide) setEditorOpen(true);
	}

	function revealRow(id: string) {
		requestAnimationFrame(() => document.getElementById(`field-row-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
	}

	function addQuestion() {
		const question = createBlankQuestion(questions, NEW_FIELD_NAMES);
		dispatch({ type: "insertQuestion", question, index: questions.length });
		if (!isWide) setEditorOpen(true);
		revealRow(question.id);
	}

	function duplicate(id: string) {
		const index = questions.findIndex(q => q.id === id);
		if (index === -1) return;
		const question = duplicateQuestion(questions[index], questions, COPY_SUFFIX);
		dispatch({ type: "insertQuestion", question, index: index + 1 });
		if (!isWide) setEditorOpen(true);
		revealRow(question.id);
	}

	async function remove(id: string): Promise<boolean> {
		const question = questions.find(q => q.id === id);
		if (!question) return false;
		const references = questions.filter(other => other.id !== id && other.filters?.conditions.some(condition => condition.type === "field" && condition.fieldId === id)).length;
		const description = [t.deleteConfirmDescription.replace("{name}", getQuestionTitle(question, locale, t.untitled)), references > 0 ? t.deleteReferenced.replace("{count}", String(references)) : ""]
			.filter(Boolean)
			.join(" ");
		if (!(await confirm({ title: t.deleteConfirmTitle, description, destructive: true }))) return false;
		dispatch({ type: "deleteQuestion", id });
		return true;
	}

	async function discardChanges() {
		if (!currentEventId) return;
		if (!(await confirm({ title: t.discardTitle, description: t.discardDescription, confirmLabel: t.discard, destructive: true }))) return;
		await loadFields(currentEventId);
	}

	async function copyForm(sourceEventId: string) {
		try {
			const response = assertOk(await adminEventFormFieldsAPI.getAll({ eventId: sourceEventId }));
			dispatch({ type: "replaceQuestions", questions: copyFieldsToQuestions(response.data || []) });
			showAlert(t.copySuccess, "success");
		} catch (error) {
			console.error("Failed to copy form:", error);
			showAlert(t.copyFailed + errorMessage(error), "error");
			throw error;
		}
	}

	async function saveForm() {
		const eventId = currentEventId;
		if (!eventId || isSaving || !isDirty) return;

		if (issues.length > 0) {
			showAlert(t.validationFailed.replace("{count}", String(issues.length)), "error");
			dispatch({ type: "select", id: issues[0].fieldId });
			if (!isWide) setEditorOpen(true);
			revealRow(issues[0].fieldId);
			return;
		}

		dispatch({ type: "setSaving", value: true });
		const server = serverRef.current;
		const idMap: Record<string, string> = {};
		let madeProgress = false;

		try {
			// 1. Remove deleted fields first so their order numbers are free again.
			const currentIds = new Set(questions.map(q => q.id));
			const deletedIds = server.ids.filter(id => !currentIds.has(id));
			const deleteResults = await Promise.allSettled(deletedIds.map(async id => assertOk(await adminEventFormFieldsAPI.delete(id))));
			const deleteErrors: string[] = [];
			deleteResults.forEach((result, i) => {
				if (result.status === "fulfilled") {
					madeProgress = true;
					server.ids = server.ids.filter(id => id !== deletedIds[i]);
				} else {
					deleteErrors.push(errorMessage(result.reason));
				}
			});
			if (deleteErrors.length > 0) throw new Error(deleteErrors.join("; "));

			// 2. Update existing fields (keeping their order) and create new ones after the current last order.
			//    The backend rejects two fields with the same order, so the final order is applied in step 4.
			let nextOrder = server.maxOrder;
			const saveResults = await Promise.allSettled(
				questions.map(async q => {
					const data = buildFieldData(q);
					if (!isTempId(q.id)) {
						assertOk(await adminEventFormFieldsAPI.update(q.id, data));
						return;
					}
					const order = ++nextOrder;
					const response = assertOk(await adminEventFormFieldsAPI.create({ eventId, order, ...data }));
					if (!response.data?.id) throw new Error("Missing field id in response");
					idMap[q.id] = response.data.id;
					server.ids.push(response.data.id);
					server.maxOrder = Math.max(server.maxOrder, order);
					server.orders.set(response.data.id, order);
				})
			);
			if (Object.keys(idMap).length > 0) {
				madeProgress = true;
				dispatch({ type: "idsSaved", idMap });
			}
			const saveErrors = saveResults.flatMap(result => (result.status === "rejected" ? [errorMessage(result.reason)] : []));
			if (saveErrors.length > 0) throw new Error(saveErrors.join("; "));
			madeProgress = true;

			// 3. Newly created fields have new ids: fix conditions that referenced their temporary ids.
			const fixResults = await Promise.allSettled(
				questions.flatMap(q => {
					const needsFilters = q.filters?.conditions.some(condition => condition.fieldId && idMap[condition.fieldId]);
					if (!needsFilters) return [];
					return [adminEventFormFieldsAPI.update(idMap[q.id] ?? q.id, { filters: serializeFilters(remapFilters(q.filters, idMap)) }).then(assertOk)];
				})
			);
			const fixErrors = fixResults.flatMap(result => (result.status === "rejected" ? [errorMessage(result.reason)] : []));
			if (fixErrors.length > 0) throw new Error(fixErrors.join("; "));

			// 4. Apply the final order in one transaction.
			const finalIds = questions.map(q => idMap[q.id] ?? q.id);
			if (finalIds.some((id, index) => server.orders.get(id) !== index)) {
				assertOk(await adminEventFormFieldsAPI.reorder(eventId, { fieldOrders: finalIds.map((id, index) => ({ id, order: index })) }));
			}

			await loadFields(eventId);
			showAlert(t.saveSuccess, "success");
		} catch (error) {
			console.error("Failed to save form:", error);
			showAlert((madeProgress ? t.savePartial : t.saveFailed) + errorMessage(error), "error");
		} finally {
			dispatch({ type: "setSaving", value: false });
		}
	}

	const saveRef = useRef(saveForm);
	useEffect(() => {
		saveRef.current = saveForm;
	});
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
				event.preventDefault();
				void saveRef.current();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	if (!currentEventId) {
		return (
			<main>
				<AdminHeader title={t.title} />
				<EmptyState
					icon={CalendarDays}
					title={t.noEventTitle}
					description={t.noEventDescription}
					action={
						<Button asChild variant="primary" size="sm">
							<Link href="/admin/events">{t.goToEvents}</Link>
						</Button>
					}
				/>
			</main>
		);
	}

	const editorHeader = selected && (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<div className="min-w-0">
				<h2 className="truncate text-base font-semibold">{t.editField}</h2>
				<p className="truncate text-sm text-muted-foreground">
					#{questions.findIndex(q => q.id === selected.id) + 1} · {getQuestionTitle(selected, locale, t.untitled)}
				</p>
			</div>
			<div className="flex items-center gap-1">
				<Button type="button" variant="outline" size="sm" onClick={() => duplicate(selected.id)}>
					<Copy className="size-4" />
					{t.duplicateField}
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={async () => {
						if (await remove(selected.id)) setEditorOpen(false);
					}}
					className="text-destructive hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 className="size-4" />
					{t.deleteField}
				</Button>
			</div>
		</div>
	);

	const editorBody = selected && (
		<FieldEditor
			key={selected.id}
			question={selected}
			questions={questions}
			eventTickets={eventTickets}
			issues={issues.filter(issue => issue.fieldId === selected.id)}
			locale={locale}
			t={t}
			updateQuestion={updateQuestion}
		/>
	);

	return (
		<main>
			<AdminHeader
				title={t.title}
				description={t.formInfo}
				actions={
					<>
						<Button type="button" variant="outline" size="sm" onClick={() => setCopyOpen(true)} disabled={isLoading || isSaving}>
							<Copy className="size-4" />
							{t.copyFrom}
						</Button>
						<Button type="button" variant="primary" size="sm" onClick={saveForm} disabled={!isDirty || isLoading} isLoading={isSaving}>
							{!isSaving && <Save className="size-4" />}
							{t.save}
						</Button>
					</>
				}
			/>

			{loadError ? (
				<EmptyState
					icon={AlertCircle}
					title={t.loadFailed}
					description={loadError}
					action={
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								dispatch({ type: "loadStarted" });
								void loadFields(currentEventId);
							}}
						>
							{t.retry}
						</Button>
					}
				/>
			) : (
				<Tabs value={view} onValueChange={value => setView(value as "builder" | "preview")} className="gap-5">
					<TabsList className="w-fit">
						<TabsTrigger value="builder" className="px-4">
							{t.tabBuilder}
						</TabsTrigger>
						<TabsTrigger value="preview" className="px-4">
							{t.tabPreview}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="builder">
						<div inert={isSaving} aria-busy={isSaving} className={isSaving ? "opacity-70 transition-opacity" : "transition-opacity"}>
							<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
								<section aria-labelledby="form-fields-heading" className="rounded-xl border bg-card p-4">
									<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
										<div className="flex items-baseline gap-2">
											<h2 id="form-fields-heading" className="text-base font-semibold">
												{t.fieldsHeading}
											</h2>
											{!isLoading && <span className="text-xs text-muted-foreground">{t.fieldCount.replace("{count}", String(questions.length))}</span>}
										</div>
										<Button type="button" variant="primary" size="sm" onClick={addQuestion} disabled={isLoading}>
											<Plus className="size-4" />
											{t.addField}
										</Button>
									</div>

									{isLoading ? (
										<div className="space-y-2" aria-hidden="true">
											{[0, 1, 2, 3].map(i => (
												<div key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-muted" />
											))}
										</div>
									) : questions.length === 0 ? (
										<EmptyState
											icon={ClipboardList}
											title={t.noFields}
											description={t.noFieldsHelp}
											className="py-10"
											action={
												<div className="flex flex-wrap justify-center gap-2">
													<Button type="button" variant="primary" size="sm" onClick={addQuestion}>
														<Plus className="size-4" />
														{t.addField}
													</Button>
													<Button type="button" variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
														<Copy className="size-4" />
														{t.copyFrom}
													</Button>
												</div>
											}
										/>
									) : (
										<FieldList
											questions={questions}
											selectedId={selectedId}
											issues={issues}
											locale={locale}
											t={t}
											onSelect={selectQuestion}
											onMove={(from, to) => dispatch({ type: "moveQuestion", from, to })}
											onDuplicate={duplicate}
											onDelete={id => void remove(id)}
										/>
									)}
								</section>

								{isWide && (
									<aside aria-label={t.editField} className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border bg-card p-5">
										{selected ? (
											<div className="space-y-5">
												{editorHeader}
												{editorBody}
											</div>
										) : (
											<EmptyState icon={MousePointerClick} title={t.selectFieldTitle} description={t.selectFieldHelp} className="border-0 py-16" />
										)}
									</aside>
								)}
							</div>
						</div>
					</TabsContent>

					<TabsContent value="preview">
						<FormPreview eventId={currentEventId} questions={questions} eventTickets={eventTickets} locale={locale} t={t} />
					</TabsContent>
				</Tabs>
			)}

			{isDirty && (
				<div role="status" className="sticky bottom-4 z-30 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
					<span className="flex items-center gap-2 text-sm font-medium">
						<span aria-hidden="true" className="size-2 rounded-full bg-amber-500" />
						{t.unsavedChanges}
					</span>
					<div className="flex items-center gap-2">
						<Button type="button" variant="outline" size="sm" onClick={discardChanges} disabled={isSaving}>
							{t.discard}
						</Button>
						<Button type="button" variant="primary" size="sm" onClick={saveForm} isLoading={isSaving}>
							{!isSaving && <Save className="size-4" />}
							{t.save}
						</Button>
					</div>
				</div>
			)}

			{!isWide && (
				<Dialog open={editorOpen && selected !== null} onOpenChange={setEditorOpen}>
					<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
						<DialogHeader className="pr-6">
							<DialogTitle>{t.editField}</DialogTitle>
							<DialogDescription>{selected ? `#${questions.findIndex(q => q.id === selected.id) + 1} · ${getQuestionTitle(selected, locale, t.untitled)}` : ""}</DialogDescription>
						</DialogHeader>
						{selected && (
							<div className="flex gap-2">
								<Button type="button" variant="outline" size="sm" onClick={() => duplicate(selected.id)}>
									<Copy className="size-4" />
									{t.duplicateField}
								</Button>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={async () => {
										if (await remove(selected.id)) setEditorOpen(false);
									}}
									className="text-destructive hover:bg-destructive/10 hover:text-destructive"
								>
									<Trash2 className="size-4" />
									{t.deleteField}
								</Button>
							</div>
						)}
						{editorBody}
					</DialogContent>
				</Dialog>
			)}

			<CopyFormDialog open={copyOpen} onOpenChange={setCopyOpen} events={otherEvents} locale={locale} hasExistingFields={questions.length > 0} t={t} onCopy={copyForm} />
		</main>
	);
}
