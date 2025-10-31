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
		...(process.env.NODE_ENV !== "production" ? [
			"http://127.0.0.1:4322",
			"http://127.0.2.2:4322",
			"http://localhost:4322"
		] : [])
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
