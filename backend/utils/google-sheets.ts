/**
 * @fileoverview Google Sheets utilities for exporting registration data
 */

import type { JWT } from "google-auth-library";
import type { sheets_v4 } from "googleapis";

interface GoogleSheetsClient {
	sheets: sheets_v4.Sheets;
	auth: JWT;
}

interface ServiceAccountKey {
	client_email: string;
	private_key: string;
	[key: string]: any;
}

interface RegistrationWithRelations {
	id: string;
	email: string;
	formData: any;
	status: string;
	createdAt: Date;
	event?: {
		name: any;
	};
	ticket?: {
		name: any;
		price: number;
	};
}

interface ExportResult {
	success: boolean;
	message: string;
}

/**
 * Get authenticated Google Sheets client
 * @returns Promise resolving to Google Sheets client and auth
 */
export async function getGoogleSheetsClient(): Promise<GoogleSheetsClient> {
	try {
		// Lazy-load googleapis only when needed
		const { google } = await import("googleapis");

		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

		const auth = new google.auth.JWT({
			email: serviceAccountKey.client_email,
			key: serviceAccountKey.private_key,
			scopes: ["https://www.googleapis.com/auth/spreadsheets"]
		});

		await auth.authorize();

		const sheets = google.sheets({ version: "v4", auth });

		return { sheets, auth: auth as unknown as JWT };
	} catch (error) {
		console.error("Failed to authenticate with Google Sheets:", error);
		throw new Error("Google Sheets authentication failed");
	}
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 * @param url - Google Sheets URL
 * @returns Spreadsheet ID or null if invalid
 */
export function extractSpreadsheetId(url: string): string | null {
	try {
		// Match patterns like:
		// https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit...
		const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
		return match ? match[1] : null;
	} catch (error) {
		console.error("Failed to extract spreadsheet ID:", error);
		return null;
	}
}

/**
 * Get the client email from service account
 * @returns Client email
 */
export function getServiceAccountEmail(): string {
	try {
		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
		return serviceAccountKey.client_email;
	} catch (error) {
		console.error("Failed to get service account email:", error);
		return "";
	}
}

/**
 * Export registrations to Google Sheets
 * @param spreadsheetId - Google Sheets spreadsheet ID
 * @param registrations - Registration data to export
 * @returns Promise resolving to export result
 */
export async function exportToGoogleSheets(spreadsheetId: string, registrations: RegistrationWithRelations[]): Promise<ExportResult> {
	try {
		const { sheets } = await getGoogleSheetsClient();

		const sheetName = "報名系統匯出";

		// Check if sheet exists, create if not
		try {
			const spreadsheet = await sheets.spreadsheets.get({
				spreadsheetId
			});

			const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === sheetName);

			if (!sheetExists) {
				// Create the sheet
				await sheets.spreadsheets.batchUpdate({
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
				});
			}
		} catch (error) {
			console.error("Failed to check/create sheet:", error);
			throw new Error("無法存取 Google Sheets，請確認已將服務帳號加入共用");
		}

		// Parse form data and collect all form field keys
		const parsedRegistrations = registrations.map(reg => ({
			...reg,
			formData: reg.formData ? JSON.parse(reg.formData as string) : {}
		}));

		const formFieldKeys = new Set<string>();
		parsedRegistrations.forEach(reg => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();

		// Helper function to get localized name
		const getLocalizedName = (nameObj: any): string => {
			if (!nameObj || typeof nameObj !== "object") return "";
			return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "";
		};

		// Helper function to format form values
		const formatFormValue = (value: any): string => {
			if (value === null || value === undefined) return "";
			if (typeof value === "object") return JSON.stringify(value);
			return String(value);
		};

		// Prepare headers
		const baseHeaders = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Created At"];
		const formDataHeaders = sortedFormFields.map(key => `Form: ${key}`);
		const headers = [...baseHeaders, ...formDataHeaders];

		// Prepare data rows
		const rows = parsedRegistrations.map(reg => {
			const baseValues = [reg.id, reg.email, getLocalizedName(reg.event?.name), getLocalizedName(reg.ticket?.name), reg.ticket?.price || 0, reg.status, new Date(reg.createdAt).toISOString()];

			const formDataValues = sortedFormFields.map(key => formatFormValue(reg.formData[key]));

			return [...baseValues, ...formDataValues];
		});

		// Clear existing data in the sheet
		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheetName}!A:ZZ`
		});

		// Write new data
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!A1`,
			valueInputOption: "RAW",
			requestBody: {
				values: [headers, ...rows]
			}
		});

		return {
			success: true,
			message: `成功匯出 ${registrations.length} 筆報名資料到 Google Sheets`
		};
	} catch (error: any) {
		console.error("Failed to export to Google Sheets:", error);
		return {
			success: false,
			message: error.message || "匯出到 Google Sheets 失敗"
		};
	}
}
