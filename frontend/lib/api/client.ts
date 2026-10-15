import { ApiResponseError, HttpError, type APIError, type RetryConfig } from "@/lib/types/client";
import { toText } from "@/lib/utils/text";
import { z } from "zod/v4";

export type RequestOptions = {
	/**
	 * Don't navigate away on 401/403/423 (login, home or account-disabled redirects); just throw.
	 * For background or optional calls that must never move a visitor off the page they are on.
	 */
	skipAuthRedirect?: boolean;
};

const BLOB_TIMEOUT_MS = 5 * 60 * 1000;

const IDEMPOTENT_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "PUT", "DELETE"]);

class APIClient {
	private baseURL: string;
	private retryConfig: RetryConfig;

	constructor(baseURL: string = "") {
		this.baseURL = baseURL;
		this.retryConfig = {
			maxRetries: 3,
			baseDelay: 1000,
			maxDelay: 10000,
			// Transient statuses only: a 500 is usually a deterministic server error, and retrying it just delays the message
			retryableStatusCodes: new Set([408, 429, 502, 503, 504]),
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

	private isRetryableError(error: unknown): boolean {
		// An HTTP error response: decide by status alone (its message is server text and says nothing about the transport)
		if (error instanceof HttpError) {
			return this.retryConfig.retryableStatusCodes.has(error.status);
		}

		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();
			return errorMessage.includes("network") || errorMessage.includes("timeout") || errorMessage.includes("connection") || errorMessage.includes("fetch");
		}

		return false;
	}

	private async fetchWithTimeout(url: string, config: RequestInit, timeoutMs: number = this.retryConfig.timeoutMs): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
				throw new Error(`Request timeout after ${timeoutMs}ms`, { cause: error });
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
			const pathWithoutLocale = currentPath.replace(/^\/(en|zh-Hant)/, "");
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

	private async getResponseError(response: Response, requestOptions?: RequestOptions): Promise<Error> {
		const redirect = () => {
			if (!requestOptions?.skipAuthRedirect) this.redirectForAuthStatus(response);
		};

		if (response.status === 401) {
			redirect();
			return new HttpError("Unauthorized - please login", response.status);
		}

		if (response.status === 423) {
			redirect();
			return new HttpError("Account disabled", response.status);
		}

		if (response.status === 403) {
			// A missing permission inside the admin area is reported in place; any other 403 means "not allowed here at all".
			const body: APIError | null = await response
				.clone()
				.json()
				.catch(() => null);
			if (body?.error?.code === "PERMISSION_DENIED") {
				return new HttpError(body.error.message ?? "Permission denied", response.status);
			}
			redirect();
			return new HttpError("Forbidden access", response.status);
		}

		const errorData: APIError = await response.json().catch(() => ({
			detail: [{ loc: [], msg: "發生了未知的錯誤 [C]", type: "unknown" }]
		}));

		if (errorData.error && errorData.error.message) {
			return errorData.error.details === undefined
				? new HttpError(errorData.error.message, response.status)
				: new ApiResponseError(errorData.error.message, response.status, errorData.error.code, errorData.error.details);
		}
		if (errorData.message) {
			return new HttpError(errorData.message, response.status);
		}
		if (typeof errorData.detail === "string") {
			return new HttpError(errorData.detail, response.status);
		}
		if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
			return new HttpError(errorData.detail.map(d => d.msg).join(", "), response.status);
		}
		return new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status);
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

	private async requestAttempt<T>(endpoint: string, url: string, config: RequestInit, schema?: z.ZodType<T>, requestOptions?: RequestOptions): Promise<T> {
		const response = await this.fetchWithTimeout(url, config);
		if (!response.ok) {
			throw await this.getResponseError(response, requestOptions);
		}
		return this.parseResponse(response, endpoint, schema);
	}

	private async retryRequest<T>(endpoint: string, url: string, config: RequestInit, schema: z.ZodType<T> | undefined, attempt: number, requestOptions?: RequestOptions): Promise<T> {
		try {
			return await this.requestAttempt(endpoint, url, config, schema, requestOptions);
		} catch (error) {
			const errorInstance = error instanceof Error ? error : new Error("網路發生問題 [C]");
			// A POST/PATCH that timed out may still have been applied (e.g. an email sent), so only idempotent methods are retried
			if (attempt > this.retryConfig.maxRetries || !IDEMPOTENT_METHODS.has(config.method ?? "GET") || !this.isRetryableError(errorInstance)) {
				throw errorInstance;
			}

			const delay = this.calculateDelay(attempt);
			await this.sleep(delay);
			return this.retryRequest(endpoint, url, config, schema, attempt + 1, requestOptions);
		}
	}

	private request<T>(endpoint: string, options: RequestInit = {}, schema?: z.ZodType<T>, requestOptions?: RequestOptions): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;
		const config: RequestInit = {
			credentials: "include",
			...options,
			headers: {
				"Content-Type": "application/json",
				...Object.fromEntries(new Headers(options.headers))
			}
		};

		return this.retryRequest(endpoint, url, config, schema, 1, requestOptions);
	}

	private withQuery(endpoint: string, params?: Record<string, unknown>): string {
		if (!params) return endpoint;
		const searchParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, toText(value));
			}
		});
		const queryString = searchParams.toString();
		return queryString ? `${endpoint}?${queryString}` : endpoint;
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>, schema?: z.ZodType<T>, requestOptions?: RequestOptions): Promise<T> {
		return this.request<T>(this.withQuery(endpoint, params), { method: "GET" }, schema, requestOptions);
	}

	/** GET a file download (non-JSON body), with the same error and auth-redirect handling as the JSON requests. */
	async getBlob(endpoint: string, params?: Record<string, unknown>, requestOptions?: RequestOptions): Promise<Blob> {
		// Exports of large events can take a while to generate, so allow longer than the JSON requests
		const response = await this.fetchWithTimeout(`${this.baseURL}${this.withQuery(endpoint, params)}`, { method: "GET", credentials: "include" }, BLOB_TIMEOUT_MS);
		if (!response.ok) {
			throw await this.getResponseError(response, requestOptions);
		}
		return response.blob();
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
