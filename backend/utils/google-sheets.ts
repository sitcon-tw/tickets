import { tracer } from "#lib/tracing";
import type { Prisma } from "#prisma/generated/prisma/client";
import { logger } from "#utils/logger";
import type { sheets_v4 } from "@googleapis/sheets";
import { SpanStatusCode } from "@opentelemetry/api";
import type { JWT } from "google-auth-library";

const componentLogger = logger.child({ component: "google-sheets" });

interface GoogleSheetsClient {
	sheets: sheets_v4.Sheets;
	auth: JWT;
}

interface ServiceAccountKey {
	client_email: string;
	private_key: string;
	[key: string]: string;
}

interface RegistrationWithRelations {
	id: string;
	email: string;
	formData: string | Record<string, unknown> | null;
	status: string;
	createdAt: Date;
	event?: {
		name: Prisma.JsonValue;
	};
	ticket?: {
		name: Prisma.JsonValue;
		price: number;
	};
}

interface ExportResult {
	success: boolean;
	message: string;
}

export async function getGoogleSheetsClient(): Promise<GoogleSheetsClient> {
	const span = tracer.startSpan("google_sheets.authenticate");

	try {
		span.addEvent("google_sheets.import_libraries");
		const { JWT } = await import("google-auth-library");
		const googleSheets = await import("@googleapis/sheets");

		span.addEvent("google_sheets.parse_service_account");
		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

		const maskedEmail = serviceAccountKey.client_email.includes("@") ? `***@${serviceAccountKey.client_email.split("@")[1]}` : "***";
		span.setAttribute("google_sheets.service_account.masked", maskedEmail);

		span.addEvent("google_sheets.create_jwt");
		const auth = new JWT({
			email: serviceAccountKey.client_email,
			key: serviceAccountKey.private_key,
			scopes: ["https://www.googleapis.com/auth/spreadsheets"]
		});

		span.addEvent("google_sheets.authorize");
		await auth.authorize();

		span.addEvent("google_sheets.create_client");
		const sheets = googleSheets.sheets({ version: "v4", auth });

		span.setStatus({ code: SpanStatusCode.OK });
		return { sheets, auth };
	} catch (error) {
		componentLogger.error({ error }, "Failed to authenticate with Google Sheets");
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: "Failed to authenticate with Google Sheets"
		});
		throw new Error("Google Sheets authentication failed");
	} finally {
		span.end();
	}
}

export function extractSpreadsheetId(url: string): string | null {
	try {
		const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
		return match ? match[1] : null;
	} catch (error) {
		componentLogger.error({ error }, "Failed to extract spreadsheet ID");
		return null;
	}
}

export function getServiceAccountEmail(): string {
	try {
		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
		return serviceAccountKey.client_email;
	} catch (error) {
		componentLogger.error({ error }, "Failed to get service account email");
		return "";
	}
}

export async function exportToGoogleSheets(spreadsheetId: string, registrations: RegistrationWithRelations[]): Promise<ExportResult> {
	const maskedSpreadsheetId = spreadsheetId.length > 8 ? `${spreadsheetId.substring(0, 8)}***` : "***";
	const span = tracer.startSpan("google_sheets.export", {
		attributes: {
			"google_sheets.spreadsheet_id.masked": maskedSpreadsheetId,
			"google_sheets.registrations_count": registrations.length
		}
	});

	if (registrations.length > 0) {
		span.setAttribute("registration.id", registrations[0].id);
	}

	try {
		span.addEvent("google_sheets.get_client");
		const { sheets } = await getGoogleSheetsClient();

		const sheetName = "報名系統匯出";
		span.setAttribute("google_sheets.sheet_name", sheetName);

		span.addEvent("google_sheets.get_spreadsheet");
		const spreadsheet = await sheets.spreadsheets
			.get({
				spreadsheetId
			})
			.catch(error => {
				componentLogger.error({ error }, "Failed to access sheet");
				throw new Error("無法存取 Google Sheets，請確認已將服務帳號加入共用");
			});

		const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === sheetName);
		span.setAttribute("google_sheets.sheet_exists", sheetExists || false);

		if (!sheetExists) {
			span.addEvent("google_sheets.create_sheet");
			await sheets.spreadsheets
				.batchUpdate({
					spreadsheetId,
					requestBody: {
						requests: [
							{
								addSheet: {
									properties: {
										title: sheetName
									}
								}
							}
						]
					}
				})
				.catch(error => {
					componentLogger.error({ error }, "Failed to create sheet");
					throw new Error("無法建立工作表，請確認已將服務帳號加入共用");
				});
		}

		span.addEvent("google_sheets.parse_data");
		const parsedRegistrations = registrations.map(reg => ({
			...reg,
			formData: reg.formData ? JSON.parse(reg.formData as string) : {}
		}));

		const formFieldKeys = new Set<string>();
		parsedRegistrations.forEach(reg => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();
		span.setAttribute("google_sheets.form_fields_count", sortedFormFields.length);

		const getLocalizedName = (nameObj: Prisma.JsonValue): string => {
			if (!nameObj) return "";
			if (typeof nameObj === "string") return nameObj;
			if (typeof nameObj !== "object" || Array.isArray(nameObj)) return "";
			const obj = nameObj as Record<string, string>;
			return obj["zh-Hant"] || obj["zh-Hans"] || obj["en"] || Object.values(obj)[0] || "";
		};

		const formatFormValue = (value: unknown): string => {
			if (value === null || value === undefined) return "";
			if (typeof value === "object") return JSON.stringify(value);
			return String(value);
		};

		span.addEvent("google_sheets.prepare_headers");
		const baseHeaders = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Created At"];
		const formDataHeaders = sortedFormFields.map(key => `Form: ${key}`);
		const headers = [...baseHeaders, ...formDataHeaders];
		span.setAttribute("google_sheets.total_columns", headers.length);

		span.addEvent("google_sheets.prepare_rows");
		const rows = parsedRegistrations.map(reg => {
			const baseValues = [
				reg.id,
				reg.email,
				getLocalizedName(reg.event?.name || ""),
				getLocalizedName(reg.ticket?.name || ""),
				reg.ticket?.price || 0,
				reg.status,
				new Date(reg.createdAt).toISOString()
			];

			const formDataValues = sortedFormFields.map(key => formatFormValue(reg.formData[key]));

			return [...baseValues, ...formDataValues];
		});
		span.setAttribute("google_sheets.total_rows", rows.length);

		span.addEvent("google_sheets.clear_sheet");
		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheetName}!A:ZZ`
		});

		span.addEvent("google_sheets.write_data");
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!A1`,
			valueInputOption: "RAW",
			requestBody: {
				values: [headers, ...rows]
			}
		});

		span.setStatus({ code: SpanStatusCode.OK });
		return {
			success: true,
			message: `成功匯出 ${registrations.length} 筆報名資料到 Google Sheets`
		};
	} catch (error) {
		componentLogger.error({ error }, "Failed to export to Google Sheets");
		span.recordException(error as Error);
		span.setStatus({
			code: SpanStatusCode.ERROR,
			message: "Failed to export to Google Sheets"
		});
		return {
			success: false,
			message: error instanceof Error ? error.message : "匯出到 Google Sheets 失敗"
		};
	} finally {
		span.end();
	}
}
