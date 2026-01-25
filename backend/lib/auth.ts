import prisma from "#/config/database";
import { getAdminEmails } from "#/config/security";
import { Prisma } from "#prisma/generated/prisma";
import { sendMagicLink } from "#utils/email";
import { logger } from "#utils/logger";
import { SpanStatusCode } from "@opentelemetry/api";
import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { magicLink } from "better-auth/plugins";
import { createSecondaryStorage } from "./auth.storage";
import { tracer } from "./tracing";

const authLogger = logger.child({ component: "auth" });

export const auth = betterAuth<BetterAuthOptions>({
	database: prismaAdapter(prisma, {
		provider: "postgresql"
	}),
	baseURL: process.env.BACKEND_URI || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: [
		process.env.FRONTEND_URI || "http://localhost:4321",
		process.env.BACKEND_URI || "http://localhost:3000",
		...(process.env.NODE_ENV !== "production" ? ["http://127.0.0.1:4322", "http://127.0.2.2:4322", "http://localhost:4322"] : [])
	],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		}
	},
	secondaryStorage: createSecondaryStorage(),
	rateLimit: {
		enabled: true,
		storage: "secondary-storage",
		window: 30000, // 30 seconds
		max: 1 // 1 request per 30 seconds
	},
	advanced: {
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for", "x-real-ip"]
		}
	},
	plugins: [
		magicLink({
			expiresIn: 600,
			sendMagicLink: async ({ email, token, url }, request?) => {
				const maskedEmail = email.length > 4 ? `${email.substring(0, 2)}***@${email.split("@")[1] || "***"}` : "***";
				const span = tracer.startSpan("auth.send_magic_link", {
					attributes: {
						"auth.email.masked": maskedEmail,
						"auth.token.length": token.length,
						"auth.method": "magic_link"
					}
				});

				try {
					const normalizedEmail = email.toLowerCase();

					let ipAddress: string | null = null;
					if (request?.headers) {
						const headers = request.headers as unknown as Record<string, string | string[] | undefined>;
						const forwardedFor = headers["x-forwarded-for"];
						const realIp = headers["x-real-ip"];
						const requestWithIp = request as unknown as Record<string, unknown>;
						ipAddress =
							(typeof forwardedFor === "string" ? forwardedFor.split(",")[0]?.trim() : undefined) ||
							(typeof realIp === "string" ? realIp : undefined) ||
							(requestWithIp.ip as string | undefined) ||
							null;

						if (ipAddress) {
							span.setAttribute("auth.ip.masked", ipAddress.substring(0, 8) + "***");
						}
					}

					try {
						span.addEvent("auth.rate_limit.check_start");
						await prisma.$transaction(
							async tx => {
								const recentAttempt = await tx.magicLinkAttempt.findFirst({
									where: {
										email: normalizedEmail,
										createdAt: {
											gt: new Date(Date.now() - 30000)
										}
									},
									orderBy: {
										createdAt: "desc"
									}
								});

								if (recentAttempt) {
									span.addEvent("auth.rate_limit.throttled", {
										reason: "recent_attempt_30s"
									});
									throw new APIError("TOO_MANY_REQUESTS", {
										message: "請稍後再試，登入信發送間隔需 30 秒"
									});
								}

								const todayStart = new Date();
								todayStart.setHours(0, 0, 0, 0);

								const todayEnd = new Date();
								todayEnd.setHours(23, 59, 59, 999);

								const lastSuccessfulLogin = await tx.magicLinkAttempt.findFirst({
									where: {
										email: normalizedEmail,
										success: true
									},
									orderBy: {
										createdAt: "desc"
									}
								});

								const failedAttemptsSinceSuccess = await tx.magicLinkAttempt.count({
									where: {
										email: normalizedEmail,
										success: false,
										createdAt: {
											gt: lastSuccessfulLogin?.createdAt || new Date(0)
										}
									}
								});

								if (failedAttemptsSinceSuccess >= 5) {
									span.addEvent("auth.rate_limit.throttled", {
										reason: "failed_attempts_limit",
										count: failedAttemptsSinceSuccess
									});
									throw new APIError("TOO_MANY_REQUESTS", {
										message: "登入嘗試次數已達上限（5 次），請稍後再試或聯繫客服"
									});
								}

								const successfulLoginsToday = await tx.magicLinkAttempt.count({
									where: {
										email: normalizedEmail,
										success: true,
										createdAt: {
											gte: todayStart,
											lte: todayEnd
										}
									}
								});

								if (successfulLoginsToday >= 20) {
									span.addEvent("auth.rate_limit.throttled", {
										reason: "daily_login_limit",
										count: successfulLoginsToday
									});
									throw new APIError("TOO_MANY_REQUESTS", {
										message: "今日登入次數已達上限（20 次），請明天再試"
									});
								}

								if (ipAddress) {
									const ipAttempts = await tx.magicLinkAttempt.count({
										where: {
											ipAddress,
											createdAt: {
												gte: todayStart,
												lte: todayEnd
											}
										}
									});

									if (ipAttempts >= 50) {
										span.addEvent("auth.rate_limit.throttled", {
											reason: "ip_daily_limit",
											count: ipAttempts
										});
										throw new APIError("TOO_MANY_REQUESTS", {
											message: "您今日已達到發送登入信的次數上限，請明天再試"
										});
									}
								}

								const magicLinkAttempt = await tx.magicLinkAttempt.create({
									data: {
										email: normalizedEmail,
										ipAddress,
										success: false
									}
								});
								span.setAttribute("magic_link_attempt.id", magicLinkAttempt.id);
								span.addEvent("auth.rate_limit.attempt_recorded");
							},
							{ isolationLevel: "Serializable" }
						);
					} catch (e) {
						if (e instanceof Prisma.PrismaClientKnownRequestError) {
							const prismaError = e as Prisma.PrismaClientKnownRequestError;
							if (prismaError.code === "P2034") {
								authLogger.warn("Magic link transaction conflict detected");
								span.addEvent("auth.rate_limit.transaction_conflict");
								throw new APIError("TOO_MANY_REQUESTS", {
									message: "系統繁忙，請稍後再試"
								});
							}
						}
						span.recordException(e as Error);
						throw e;
					}

					let locale = "zh-Hant";
					let returnUrl: string | null = null;
					try {
						const constructedUrl = new URL(url);
						const callbackURL = constructedUrl.searchParams.get("callbackURL");
						if (callbackURL) {
							const callbackUrl = new URL(callbackURL);
							const callbackPathParts = callbackUrl.pathname.split("/").filter(Boolean);
							if (callbackPathParts.length > 0 && ["en", "zh-Hant", "zh-Hans"].includes(callbackPathParts[0])) {
								locale = callbackPathParts[0];
							}
							returnUrl = callbackUrl.pathname + callbackUrl.search;
						}
					} catch (e) {
						authLogger.error({ error: e }, "Error parsing callback URL");
						span.addEvent("auth.url_parse_error");
					}

					span.setAttribute("auth.locale", locale);

					let frontendUrl = `${process.env.FRONTEND_URI || "http://localhost:4321"}/api/auth/magic-link/verify?token=${token}&locale=${locale}`;
					if (returnUrl) {
						frontendUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
					}

					span.addEvent("auth.email.send_start");
					await sendMagicLink(email, frontendUrl);
					span.addEvent("auth.email.send_complete");
					span.setStatus({ code: SpanStatusCode.OK });
				} catch (error) {
					span.recordException(error as Error);
					span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to send magic link" });
					throw error;
				} finally {
					span.end();
				}
			}
		})
	],
	emailAndPassword: {
		enabled: false
	},
	databaseHooks: {
		user: {
			create: {
				before: async user => {
					const adminEmails = getAdminEmails();
					if (adminEmails.includes(user.email)) {
						return {
							data: {
								...user,
								role: "admin"
							}
						};
					}
					return { data: user };
				}
			}
		}
	}
});
