import type { JsonValue } from "@prisma/client/runtime/library";
import type { sheets_v4 } from "googleapis";

interface GoogleSheetsClient {
	sheets: sheets_v4.Sheets;
	auth: unknown;
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
		name: JsonValue;
	};
	ticket?: {
		name: JsonValue;
		price: number;
	};
}

interface ExportResult {
	success: boolean;
	message: string;
}

export async function getGoogleSheetsClient(): Promise<GoogleSheetsClient> {
	try {
		const { google } = await import("googleapis");

		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);

		const auth = new google.auth.JWT({
			email: serviceAccountKey.client_email,
			key: serviceAccountKey.private_key,
			scopes: ["https://www.googleapis.com/auth/spreadsheets"]
		});

		await auth.authorize();

		const sheets = google.sheets({ version: "v4", auth });

		return { sheets, auth };
	} catch (error) {
		console.error("Failed to authenticate with Google Sheets:", error);
		throw new Error("Google Sheets authentication failed");
	}
}

export function extractSpreadsheetId(url: string): string | null {
	try {
		const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
		return match ? match[1] : null;
	} catch (error) {
		console.error("Failed to extract spreadsheet ID:", error);
		return null;
	}
}

export function getServiceAccountEmail(): string {
	try {
		const serviceAccountKey: ServiceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
		return serviceAccountKey.client_email;
	} catch (error) {
		console.error("Failed to get service account email:", error);
		return "";
	}
}

export async function exportToGoogleSheets(spreadsheetId: string, registrations: RegistrationWithRelations[]): Promise<ExportResult> {
	try {
		const { sheets } = await getGoogleSheetsClient();

		const sheetName = "報名系統匯出";

		const spreadsheet = await sheets.spreadsheets
			.get({
				spreadsheetId
			})
			.catch(error => {
				console.error("Failed to access sheet:", error);
				throw new Error("無法存取 Google Sheets，請確認已將服務帳號加入共用");
			});

		const sheetExists = spreadsheet.data.sheets?.some(sheet => sheet.properties?.title === sheetName);

		if (!sheetExists) {
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
					console.error("Failed to create sheet:", error);
					throw new Error("無法建立工作表，請確認已將服務帳號加入共用");
				});
		}

		const parsedRegistrations = registrations.map(reg => ({
			...reg,
			formData: reg.formData ? JSON.parse(reg.formData as string) : {}
		}));

		const formFieldKeys = new Set<string>();
		parsedRegistrations.forEach(reg => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();

		const getLocalizedName = (nameObj: JsonValue): string => {
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

		const baseHeaders = ["ID", "Email", "Event", "Ticket", "Price", "Status", "Created At"];
		const formDataHeaders = sortedFormFields.map(key => `Form: ${key}`);
		const headers = [...baseHeaders, ...formDataHeaders];

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

		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheetName}!A:ZZ`
		});

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
	} catch (error) {
		console.error("Failed to export to Google Sheets:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "匯出到 Google Sheets 失敗"
		};
	}
}
