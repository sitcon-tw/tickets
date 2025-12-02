import { sendMagicLink } from "#utils/email";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import prisma from "../config/database";
import { getAdminEmails } from "../config/security";

export const auth: ReturnType<typeof betterAuth> = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "sqlite"
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

				const recentAttempt = await prisma.magicLinkAttempt.findFirst({
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
					throw new Error("請稍後再試，登入信發送間隔需 30 秒");
				}

				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);

				const todayEnd = new Date();
				todayEnd.setHours(23, 59, 59, 999);

				const lastSuccessfulLogin = await prisma.magicLinkAttempt.findFirst({
					where: {
						email: normalizedEmail,
						success: true
					},
					orderBy: {
						createdAt: "desc"
					}
				});

				const failedAttemptsSinceSuccess = await prisma.magicLinkAttempt.count({
					where: {
						email: normalizedEmail,
						success: false,
						createdAt: {
							gt: lastSuccessfulLogin?.createdAt || new Date(0)
						}
					}
				});

				if (failedAttemptsSinceSuccess >= 3) {
					throw new Error("登入嘗試次數已達上限（3 次），請稍後再試或聯繫客服");
				}

				const successfulLoginsToday = await prisma.magicLinkAttempt.count({
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
					throw new Error("今日登入次數已達上限（20 次），請明天再試");
				}

				let ipAddress: string | null = null;
				if (request?.headers) {
					ipAddress = (request.headers as any)["x-forwarded-for"]?.split(",")[0]?.trim() || (request.headers as any)["x-real-ip"] || (request as any).ip;
				}

				if (ipAddress) {
					const ipAttempts = await prisma.magicLinkAttempt.count({
						where: {
							ipAddress,
							createdAt: {
								gte: todayStart,
								lte: todayEnd
							}
						}
					});

					if (ipAttempts >= 50) {
						throw new Error("您今日已達到發送登入信的次數上限，請明天再試");
					}
				}

				await prisma.magicLinkAttempt.create({
					data: {
						email: normalizedEmail,
						ipAddress,
						success: false 
					}
				});

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
					console.error("Error parsing callback URL:", e);
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
