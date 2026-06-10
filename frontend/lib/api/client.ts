import { APIError, RetryConfig } from "@/lib/types/client";
import { z } from "zod";

class APIClient {
	private baseURL: string;
	private retryConfig: RetryConfig;

	constructor(baseURL: string = "") {
		this.baseURL = baseURL;
		this.retryConfig = {
			maxRetries: 3,
			baseDelay: 1000,
			maxDelay: 10000,
			retryableStatusCodes: new Set([408, 429, 500, 502, 503, 504]),
			timeoutMs: 30000
		};
	}

	setRetryConfig(config: Partial<RetryConfig>): void {
		this.retryConfig = { ...this.retryConfig, ...config };
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private calculateDelay(attempt: number): number {
		const exponentialDelay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
		const jitter = Math.random() * 0.3 * exponentialDelay;
		return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
	}

	private isRetryableError(error: unknown, response?: Response): boolean {
		if (response) {
			return this.retryConfig.retryableStatusCodes.has(response.status);
		}

		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();
			return errorMessage.includes("network") || errorMessage.includes("timeout") || errorMessage.includes("connection") || errorMessage.includes("fetch");
		}

		return false;
	}

	private async fetchWithTimeout(url: string, config: RequestInit): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeoutMs);

		try {
			const response = await fetch(url, {
				...config,
				signal: controller.signal
			});
			clearTimeout(timeoutId);
			return response;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === "AbortError") {
				throw new Error(`Request timeout after ${this.retryConfig.timeoutMs}ms`);
			}
			throw error;
		}
	}

	private redirectForAuthStatus(response: Response): void {
		const browserLocation = typeof window !== "undefined" ? window.location : null;
		if (!browserLocation) return;

		const currentPath = browserLocation.pathname;
		const locale = currentPath.split("/")[1] || "zh-Hant";

		if (response.status === 401) {
			const pathWithoutLocale = currentPath.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
			const isHomePage = pathWithoutLocale === "/" || pathWithoutLocale === "";

			if (!currentPath.includes("/login") && !isHomePage) {
				const shouldIncludeReturnUrl = !currentPath.includes("/login") && !currentPath.includes("/verify");
				const returnUrl = shouldIncludeReturnUrl ? encodeURIComponent(currentPath + browserLocation.search) : "";
				browserLocation.href = `/${locale}/login${returnUrl ? `?returnUrl=${returnUrl}` : ""}`;
			}
			return;
		}

		if (response.status === 423) {
			if (!currentPath.includes("/account-disabled")) {
				browserLocation.href = `/${locale}/account-disabled`;
			}
			return;
		}

		if (response.status === 403) {
			const isOnHomePage = currentPath === `/${locale}` || currentPath === `/${locale}/` || currentPath === "/";
			if (!isOnHomePage) {
				browserLocation.href = `/${locale}/`;
			}
		}
	}

	private async getResponseError(response: Response): Promise<Error> {
		if (response.status === 401) {
			this.redirectForAuthStatus(response);
			return new Error("Unauthorized - please login");
		}

		if (response.status === 423) {
			this.redirectForAuthStatus(response);
			return new Error("Account disabled");
		}

		if (response.status === 403) {
			this.redirectForAuthStatus(response);
			return new Error("Forbidden access");
		}

		const errorData: APIError = await response.json().catch(() => ({
			detail: [{ loc: [], msg: "發生了未知的錯誤 [C]", type: "unknown" }]
		}));

		if (errorData.error && errorData.error.message) {
			return new Error(errorData.error.message);
		}
		if (errorData.message) {
			return new Error(errorData.message);
		}
		if (typeof errorData.detail === "string") {
			return new Error(errorData.detail);
		}
		if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
			return new Error(errorData.detail.map(d => d.msg).join(", "));
		}
		return new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	private async parseResponse<T>(response: Response, endpoint: string, schema?: z.ZodType<T>): Promise<T> {
		const contentType = response.headers.get("content-type");
		const isJsonResponse = contentType
			?.toLowerCase()
			.split(";")
			.some(part => part.trim() === "application/json");
		if (!isJsonResponse) {
			throw new Error("Invalid response format");
		}

		const jsonData = await response.json();

		if (!schema) {
			return jsonData;
		}

		const result = schema.safeParse(jsonData);
		if (!result.success) {
			const errorMessages = result.error.issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
			console.error({
				message: "API response validation failed",
				issues: result.error.issues,
				jsonData,
				schema,
				endpoint
			});
			throw new Error(`API response validation failed: ${errorMessages}`);
		}
		return result.data;
	}

	private async requestAttempt<T>(endpoint: string, url: string, config: RequestInit, schema?: z.ZodType<T>): Promise<T> {
		const response = await this.fetchWithTimeout(url, config);
		if (!response.ok) {
			throw await this.getResponseError(response);
		}
		return this.parseResponse(response, endpoint, schema);
	}

	private async retryRequest<T>(endpoint: string, url: string, config: RequestInit, schema: z.ZodType<T> | undefined, attempt: number): Promise<T> {
		try {
			return await this.requestAttempt(endpoint, url, config, schema);
		} catch (error) {
			const errorInstance = error instanceof Error ? error : new Error("網路發生問題 [C]");
			if (attempt > this.retryConfig.maxRetries || !this.isRetryableError(errorInstance)) {
				throw errorInstance;
			}

			const delay = this.calculateDelay(attempt);
			await this.sleep(delay);
			return this.retryRequest(endpoint, url, config, schema, attempt + 1);
		}
	}

	private request<T>(endpoint: string, options: RequestInit = {}, schema?: z.ZodType<T>): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const config: RequestInit = {
			headers: {
				"Content-Type": "application/json",
				...options.headers
			},
			credentials: "include",
			...options
		};

		return this.retryRequest(endpoint, url, config, schema, 1);
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>, schema?: z.ZodType<T>): Promise<T> {
		let finalEndpoint = endpoint;
		if (params) {
			const searchParams = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			});
			const queryString = searchParams.toString();
			finalEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
		}
		return this.request<T>(finalEndpoint, { method: "GET" }, schema);
	}

	async post<T>(endpoint: string, data?: unknown, schema?: z.ZodType<T>): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: "POST",
				body: data ? JSON.stringify(data) : "{}"
			},
			schema
		);
	}

	async put<T>(endpoint: string, data?: unknown, schema?: z.ZodType<T>): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: "PUT",
				body: data ? JSON.stringify(data) : "{}"
			},
			schema
		);
	}

	async patch<T>(endpoint: string, data?: unknown, schema?: z.ZodType<T>): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: "PATCH",
				body: data ? JSON.stringify(data) : "{}"
			},
			schema
		);
	}

	async delete<T>(endpoint: string, schema?: z.ZodType<T>): Promise<T> {
		return this.request<T>(endpoint, { method: "DELETE", body: "{}" }, schema);
	}
}

export const apiClient = new APIClient();

export type { RetryConfig };
