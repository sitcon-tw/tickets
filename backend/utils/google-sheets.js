/**
 * @fileoverview Google Sheets utilities for exporting registration data
 */

import { google } from "googleapis";

/**
 * Get authenticated Google Sheets client
 * @returns {Promise<{sheets: import('googleapis').sheets_v4.Sheets, auth: import('google-auth-library').JWT}>}
 */
export async function getGoogleSheetsClient() {
	try {
		const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

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

/**
 * Extract spreadsheet ID from Google Sheets URL
 * @param {string} url - Google Sheets URL
 * @returns {string | null} - Spreadsheet ID or null if invalid
 */
export function extractSpreadsheetId(url) {
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
 * @returns {string} - Client email
 */
export function getServiceAccountEmail() {
	try {
		const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
		return serviceAccountKey.client_email;
	} catch (error) {
		console.error("Failed to get service account email:", error);
		return "";
	}
}

/**
 * Export registrations to Google Sheets
 * @param {string} spreadsheetId - Google Sheets spreadsheet ID
 * @param {Array<Object>} registrations - Registration data to export
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function exportToGoogleSheets(spreadsheetId, registrations) {
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
			formData: reg.formData ? JSON.parse(reg.formData) : {}
		}));

		const formFieldKeys = new Set();
		parsedRegistrations.forEach(reg => {
			Object.keys(reg.formData).forEach(key => formFieldKeys.add(key));
		});

		const sortedFormFields = Array.from(formFieldKeys).sort();

		// Helper function to get localized name
		const getLocalizedName = nameObj => {
			if (!nameObj || typeof nameObj !== "object") return "";
			return nameObj["zh-Hant"] || nameObj["zh-Hans"] || nameObj["en"] || Object.values(nameObj)[0] || "";
		};

		// Helper function to format form values
		const formatFormValue = value => {
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
	} catch (error) {
		console.error("Failed to export to Google Sheets:", error);
		return {
			success: false,
			message: error.message || "匯出到 Google Sheets 失敗"
		};
	}
}
