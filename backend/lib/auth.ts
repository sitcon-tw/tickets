import prisma from "#/config/database";
import { getAdminEmails } from "#/config/security";
import { sendMagicLink } from "#utils/email";
import { logger } from "#utils/logger.ts";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { magicLink } from "better-auth/plugins";

interface PrismaError extends Error {
	code?: string;
	meta?: {
		target?: string[];
	};
}

const authLogger = logger.child({ component: "auth" });

export const auth: ReturnType<typeof betterAuth> = betterAuth({
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
	plugins: [
		magicLink({
			expiresIn: 600,
			sendMagicLink: async ({ email, token, url }, request?) => {
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
				}

				try {
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
									throw new APIError("TOO_MANY_REQUESTS", {
										message: "您今日已達到發送登入信的次數上限，請明天再試"
									});
								}
							}

							await tx.magicLinkAttempt.create({
								data: {
									email: normalizedEmail,
									ipAddress,
									success: false
								}
							});
						},
						{ isolationLevel: "Serializable" }
					);
				} catch (e) {
					const prismaError = e as PrismaError;
					if (prismaError.code === "P2034") {
						authLogger.warn("Magic link transaction conflict detected");
						throw new APIError("TOO_MANY_REQUESTS", {
							message: "系統繁忙，請稍後再試"
						});
					}
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
				}

				let frontendUrl = `${process.env.FRONTEND_URI || "http://localhost:4321"}/api/auth/magic-link/verify?token=${token}&locale=${locale}`;
				if (returnUrl) {
					frontendUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
				}
				await sendMagicLink(email, frontendUrl);
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
