import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { buildRegistrationExportTable, type ExportCell, type ExportTable } from "#utils/registration-export";
import { logger } from "#utils/logger";
import type { sheets_v4 } from "@googleapis/sheets";
import { SpanStatusCode } from "@opentelemetry/api";
import { createHash } from "node:crypto";

const componentLogger = logger.child({ component: "google-sheets" });

const SHEET_NAME = "報名系統匯出";
// Google Sheets caps a spreadsheet at 10 million cells
const MAX_CELLS = 10_000_000;

const AUTO_SYNC_INTERVAL_MS = 30 * 1000;
const RETRY_BASE_MS = 60 * 1000;
const RETRY_MAX_MS = 30 * 60 * 1000;

interface ServiceAccountKey {
	client_email: string;
	private_key: string;
}

export interface SyncResult {
	success: boolean;
	message: string;
	count?: number;
}

/** An error whose message is safe to show to admins. */
class SheetsError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "SheetsError";
	}
}

function readServiceAccountKey(): ServiceAccountKey | null {
	const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
	if (!raw) return null;
	try {
		const key = JSON.parse(raw) as Partial<ServiceAccountKey>;
		return key.client_email && key.private_key ? { client_email: key.client_email, private_key: key.private_key } : null;
	} catch (error) {
		componentLogger.error({ error }, "GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
		return null;
	}
}

export function isGoogleSheetsConfigured(): boolean {
	return readServiceAccountKey() !== null;
}

export function getServiceAccountEmail(): string {
	return readServiceAccountKey()?.client_email ?? "";
}

// The JWT client refreshes its own access token, so one client serves the whole process
let clientPromise: Promise<sheets_v4.Sheets> | null = null;

function getSheetsClient(): Promise<sheets_v4.Sheets> {
	clientPromise ??= (async () => {
		const key = readServiceAccountKey();
		if (!key) throw new SheetsError("尚未設定 Google 服務帳號");

		const { JWT } = await import("google-auth-library");
		const googleSheets = await import("@googleapis/sheets");
		const auth = new JWT({ email: key.client_email, key: key.private_key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
		await auth.authorize();
		return googleSheets.sheets({ version: "v4", auth });
	})().catch(error => {
		clientPromise = null;
		componentLogger.error({ error }, "Failed to authenticate with Google Sheets");
		throw error instanceof SheetsError ? error : new SheetsError("Google Sheets 驗證失敗", { cause: error });
	});
	return clientPromise;
}

export function extractSpreadsheetId(url: string): string | null {
	return url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
}

export function spreadsheetUrl(spreadsheetId: string): string {
	return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}

function maskId(spreadsheetId: string): string {
	return spreadsheetId.length > 8 ? `${spreadsheetId.substring(0, 8)}***` : "***";
}

function apiStatus(error: unknown): number | undefined {
	const e = error as { status?: number; code?: number | string; response?: { status?: number } };
	return e?.response?.status ?? e?.status ?? (typeof e?.code === "number" ? e.code : undefined);
}

function describeApiError(error: unknown, fallback: string): SheetsError {
	if (error instanceof SheetsError) return error;
	const status = apiStatus(error);
	if (status === 403) return new SheetsError("沒有存取權限，請確認已將服務帳號加入共用並設為「編輯者」", { cause: error });
	if (status === 404) return new SheetsError("找不到此 Google Sheets，請確認網址是否正確", { cause: error });
	if (status === 429) return new SheetsError("Google Sheets API 請求過於頻繁，請稍後再試", { cause: error });
	return new SheetsError(fallback, { cause: error });
}

function toCell(value: ExportCell): sheets_v4.Schema$CellData {
	// stringValue is stored as literal text, so user-submitted "=..." values are never evaluated as formulas
	return { userEnteredValue: typeof value === "number" ? { numberValue: value } : { stringValue: value } };
}

/**
 * Replace the export sheet's contents with `table`. Clearing and writing happen in a single
 * batchUpdate, so a failure never leaves the sheet half-written or empty.
 */
async function writeTable(spreadsheetId: string, table: ExportTable): Promise<void> {
	const sheets = await getSheetsClient();

	const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties(sheetId,title,gridProperties)" }).catch(error => {
		throw describeApiError(error, "無法存取 Google Sheets，請確認已將服務帳號加入共用");
	});

	let properties = spreadsheet.data.sheets?.find(sheet => sheet.properties?.title === SHEET_NAME)?.properties;
	if (!properties) {
		const created = await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] } }).catch(error => {
			throw describeApiError(error, "無法建立工作表，請確認服務帳號具有編輯權限");
		});
		properties = created.data.replies?.[0]?.addSheet?.properties;
	}
	const sheetId = properties?.sheetId;
	if (sheetId === null || sheetId === undefined) throw new SheetsError("無法取得工作表資訊");

	const neededRows = table.rows.length + 1;
	const neededColumns = table.headers.length;
	const rowCount = Math.max(properties?.gridProperties?.rowCount ?? 0, neededRows);
	const columnCount = Math.max(properties?.gridProperties?.columnCount ?? 0, neededColumns);
	if (rowCount * columnCount > MAX_CELLS) throw new SheetsError("資料量超過 Google Sheets 儲存格上限");

	await sheets.spreadsheets
		.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					{
						updateSheetProperties: {
							properties: { sheetId, gridProperties: { rowCount, columnCount, frozenRowCount: 1 } },
							fields: "gridProperties.rowCount,gridProperties.columnCount,gridProperties.frozenRowCount"
						}
					},
					// No rows + whole-sheet range clears every value left over from the previous export
					{ updateCells: { range: { sheetId }, fields: "userEnteredValue" } },
					{
						updateCells: {
							start: { sheetId, rowIndex: 0, columnIndex: 0 },
							rows: [table.headers, ...table.rows].map(row => ({ values: row.map(toCell) })),
							fields: "userEnteredValue"
						}
					}
				]
			}
		})
		.catch(error => {
			throw describeApiError(error, "寫入 Google Sheets 失敗");
		});
}

/** Export every registration of an event to the given spreadsheet. */
export async function syncRegistrationsToSheet(eventId: string, spreadsheetId: string): Promise<SyncResult> {
	const span = tracer.startSpan("google_sheets.sync", {
		attributes: { "event.id": eventId, "google_sheets.spreadsheet_id.masked": maskId(spreadsheetId), "google_sheets.sheet_name": SHEET_NAME }
	});

	try {
		span.addEvent("google_sheets.build_table");
		const table = await buildRegistrationExportTable({ eventId });
		span.setAttribute("google_sheets.total_rows", table.rows.length);
		span.setAttribute("google_sheets.total_columns", table.headers.length);

		span.addEvent("google_sheets.write");
		await writeTable(spreadsheetId, table);

		span.setStatus({ code: SpanStatusCode.OK });
		return { success: true, message: `成功匯出 ${table.rows.length} 筆報名資料到 Google Sheets`, count: table.rows.length };
	} catch (error) {
		componentLogger.error({ error, eventId }, "Failed to export to Google Sheets");
		span.recordException(error as Error);
		span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to export to Google Sheets" });
		return { success: false, message: error instanceof SheetsError ? error.message : "匯出到 Google Sheets 失敗" };
	} finally {
		span.end();
	}
}

/**
 * Cheap summary of everything that shows up in the export. Registration and ticket updates bump
 * `updatedAt`; deletions change the count; form field edits are hashed directly since they have no timestamp.
 */
async function computeFingerprint(eventId: string, spreadsheetId: string): Promise<string> {
	const [registrations, tickets, formFields, event] = await Promise.all([
		prisma.registration.aggregate({ where: { eventId }, _count: { _all: true }, _max: { updatedAt: true } }),
		prisma.ticket.aggregate({ where: { eventId }, _max: { updatedAt: true } }),
		prisma.eventFormFields.findMany({ where: { eventId }, orderBy: { order: "asc" }, select: { id: true, name: true, type: true, values: true } }),
		prisma.event.findUnique({ where: { id: eventId }, select: { name: true } })
	]);
	return createHash("sha256")
		.update(
			JSON.stringify([spreadsheetId, registrations._count._all, registrations._max.updatedAt?.toISOString() ?? null, tickets._max.updatedAt?.toISOString() ?? null, formFields, event?.name ?? null])
		)
		.digest("hex");
}

const inFlight = new Set<string>();
const retryState = new Map<string, { failures: number; nextAttemptAt: number }>();

/**
 * Sync one event and record the outcome on the event. Concurrent calls for the same
 * event are dropped, since the running sync already exports the latest data it reads.
 */
export async function runEventSheetsSync(eventId: string, { force }: { force: boolean }): Promise<SyncResult> {
	if (inFlight.has(eventId)) return { success: false, message: "同步進行中，請稍後再試" };
	inFlight.add(eventId);

	try {
		const event = await prisma.event.findUnique({ where: { id: eventId }, select: { googleSheetsUrl: true, googleSheetsSyncFingerprint: true } });
		const spreadsheetId = event?.googleSheetsUrl ? extractSpreadsheetId(event.googleSheetsUrl) : null;
		if (!spreadsheetId) return { success: false, message: "尚未設定 Google Sheets 網址" };

		const fingerprint = await computeFingerprint(eventId, spreadsheetId);
		if (!force && fingerprint === event?.googleSheetsSyncFingerprint) return { success: true, message: "資料未變更" };

		const result = await syncRegistrationsToSheet(eventId, spreadsheetId);
		// updateMany so a concurrently deleted event doesn't throw
		await prisma.event.updateMany({
			where: { id: eventId },
			data: result.success
				? { googleSheetsSyncedAt: new Date(), googleSheetsSyncError: null, googleSheetsSyncFingerprint: fingerprint }
				: { googleSheetsSyncError: result.message, googleSheetsSyncFingerprint: null }
		});

		if (result.success) {
			retryState.delete(eventId);
		} else {
			const failures = (retryState.get(eventId)?.failures ?? 0) + 1;
			retryState.set(eventId, { failures, nextAttemptAt: Date.now() + Math.min(RETRY_BASE_MS * 2 ** (failures - 1), RETRY_MAX_MS) });
		}
		return result;
	} finally {
		inFlight.delete(eventId);
	}
}

/** Clear the failure backoff so the next sweep retries right away (e.g. after the admin changes settings). */
export function resetSheetsSyncBackoff(eventId: string): void {
	retryState.delete(eventId);
}

async function sweepAutoSync(): Promise<void> {
	const events = await prisma.event.findMany({
		where: { googleSheetsAutoSync: true, googleSheetsUrl: { not: null } },
		select: { id: true }
	});

	const now = Date.now();
	for (const { id } of events) {
		const retry = retryState.get(id);
		if (retry && retry.nextAttemptAt > now) continue;
		try {
			await runEventSheetsSync(id, { force: false });
		} catch (error) {
			componentLogger.error({ error, eventId: id }, "Google Sheets auto-sync failed");
		}
	}
}

/** Periodically push registration changes to the sheet of every event with auto-sync enabled. */
export function startGoogleSheetsAutoSync(): NodeJS.Timeout | null {
	if (!isGoogleSheetsConfigured()) {
		componentLogger.info("GOOGLE_SERVICE_ACCOUNT_KEY not set; Google Sheets auto-sync disabled");
		return null;
	}

	let running = false;
	const timer = setInterval(() => {
		if (running) return;
		running = true;
		sweepAutoSync()
			.catch(error => componentLogger.error({ error }, "Google Sheets auto-sync sweep failed"))
			.finally(() => {
				running = false;
			});
	}, AUTO_SYNC_INTERVAL_MS);
	timer.unref();
	return timer;
}
