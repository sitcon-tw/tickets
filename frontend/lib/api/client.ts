import { APIError, RetryConfig } from "@/lib/types/client";

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

	private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const config: RequestInit = {
			headers: {
				"Content-Type": "application/json",
				...options.headers
			},
			credentials: "include",
			...options
		};

		let lastError: Error = new Error("Max retries exceeded");

		for (let attempt = 1; attempt <= this.retryConfig.maxRetries + 1; attempt++) {
			try {
				const response = await this.fetchWithTimeout(url, config);

				if (!response.ok) {
					if (response.status === 401) {
						if (typeof window !== "undefined") {
							const currentPath = window.location.pathname;
							const locale = currentPath.split("/")[1] || "zh-Hant";
							const pathWithoutLocale = currentPath.replace(/^\/(en|zh-Hant|zh-Hans)/, "");
							const isHomePage = pathWithoutLocale === "/" || pathWithoutLocale === "";

							if (!currentPath.includes("/login") && !isHomePage) {
								const shouldIncludeReturnUrl = !currentPath.includes("/login") && !currentPath.includes("/verify");
								const returnUrl = shouldIncludeReturnUrl ? encodeURIComponent(currentPath + window.location.search) : "";
								window.location.href = `/${locale}/login${returnUrl ? `?returnUrl=${returnUrl}` : ""}`;
							}
						}
						throw new Error("Unauthorized - please login");
					}

					if (response.status === 423) {
						if (typeof window !== "undefined") {
							const locale = window.location.pathname.split("/")[1] || "zh-Hant";
							if (!window.location.pathname.includes("/account-disabled")) {
								window.location.href = `/${locale}/account-disabled`;
							}
						}
						throw new Error("Account disabled");
					}

					if (response.status === 403) {
						if (typeof window !== "undefined") {
							const currentPath = window.location.pathname;
							const locale = currentPath.split("/")[1] || "zh-Hant";
							const isOnHomePage = currentPath === `/${locale}` || currentPath === `/${locale}/` || currentPath === "/";

							if (!isOnHomePage) {
								window.location.href = `/${locale}/`;
							}
						}
						throw new Error("Forbidden access");
					}

					const errorData: APIError = await response.json().catch(() => ({
						detail: [{ loc: [], msg: "發生了未知的錯誤 [C]", type: "unknown" }]
					}));

					let errorMessage: string;
					if (errorData.error && errorData.error.message) {
						errorMessage = errorData.error.message;
					} else if (errorData.message) {
						errorMessage = errorData.message;
					} else if (errorData.detail) {
						if (typeof errorData.detail === "string") {
							errorMessage = errorData.detail;
						} else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
							errorMessage = errorData.detail.map(d => d.msg).join(", ");
						} else {
							errorMessage = `HTTP ${response.status}: ${response.statusText}`;
						}
					} else {
						errorMessage = `HTTP ${response.status}: ${response.statusText}`;
					}

					const error = new Error(errorMessage);

					if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(error, response)) {
						lastError = error;
						const delay = this.calculateDelay(attempt);
						await this.sleep(delay);
						continue;
					}

					throw error;
				}

				const contentType = response.headers.get("content-type");
				if (contentType && contentType.includes("application/json")) {
					return await response.json();
				}

				return {} as T;
			} catch (error) {
				const errorInstance = error instanceof Error ? error : new Error("網路發生問題 [C]");

				if (attempt <= this.retryConfig.maxRetries && this.isRetryableError(errorInstance)) {
					lastError = errorInstance;
					const delay = this.calculateDelay(attempt);
					await this.sleep(delay);
					continue;
				}

				throw errorInstance;
			}
		}

		throw lastError || new Error("Max retries exceeded");
	}

	async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
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
		return this.request<T>(finalEndpoint, { method: "GET" });
	}

	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: data ? JSON.stringify(data) : "{}"
		});
	}

	async put<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: data ? JSON.stringify(data) : "{}"
		});
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "DELETE", body: "{}" });
	}
}

export const apiClient = new APIClient();

export type { RetryConfig };

export default APIClient;
