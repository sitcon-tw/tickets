import { sendMagicLink } from "#utils/email.js";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { getAdminEmails } from "../config/security.js";
import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

export const auth = betterAuth({
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
		},
		cookieOptions: {
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			path: "/"
		}
	},
	plugins: [
		magicLink({
			expiresIn: 600,
			sendMagicLink: async ({ email, token, url }, request) => {
				// Rate limiting: Check for recent magic link attempts by email (30 seconds)
				const recentAttempt = await prisma.magicLinkAttempt.findFirst({
					where: {
						email: email.toLowerCase(),
						createdAt: {
							gt: new Date(Date.now() - 30000) // Within last 30 seconds
						}
					},
					orderBy: {
						createdAt: "desc"
					}
				});

				if (recentAttempt) {
					throw new Error("請稍後再試，登入信發送間隔需 30 秒");
				}

				// Rate limiting: Check daily limit by email (3 per day)
				const todayStart = new Date();
				todayStart.setHours(0, 0, 0, 0);

				const todayEnd = new Date();
				todayEnd.setHours(23, 59, 59, 999);

				const todayAttempts = await prisma.magicLinkAttempt.count({
					where: {
						email: email.toLowerCase(),
						createdAt: {
							gte: todayStart,
							lte: todayEnd
						}
					}
				});

				if (todayAttempts >= 3) {
					throw new Error("此信箱今日已達到發送登入信的次數上限（3 次），請明天再試");
				}

				// Rate limiting: Check by IP address if available (10 per day to prevent abuse)
				let ipAddress = null;
				if (request?.headers) {
					ipAddress = request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || request.headers["x-real-ip"] || request.ip;
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

					if (ipAttempts >= 10) {
						throw new Error("您今日已達到發送登入信的次數上限，請明天再試");
					}
				}

				// Record this attempt
				await prisma.magicLinkAttempt.create({
					data: {
						email: email.toLowerCase(),
						ipAddress
					}
				});

				let locale = "zh-Hant";
				let returnUrl = null;
				try {
					const constructedUrl = new URL(url);
					const callbackURL = constructedUrl.searchParams.get("callbackURL");
					if (callbackURL) {
						const callbackUrl = new URL(callbackURL);
						const callbackPathParts = callbackUrl.pathname.split("/").filter(Boolean);
						if (callbackPathParts.length > 0 && ["en", "zh-Hant", "zh-Hans"].includes(callbackPathParts[0])) {
							locale = callbackPathParts[0];
						}
						// Extract returnUrl from callbackURL (path + search params)
						returnUrl = callbackUrl.pathname + callbackUrl.search;
					}
				} catch (e) {}

				// Send users to frontend, which will proxy the verification to backend
				// Include returnUrl in the verification link
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
