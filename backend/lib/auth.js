import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { PrismaClient } from "../generated/prisma/index.js";
import { sendMagicLink } from "#utils/email.js";

const prisma = new PrismaClient();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "sqlite"
	}),
	baseURL: process.env.BACKEND_URI || "http://localhost:3000",
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: [process.env.FRONTEND_URI || "http://localhost:4321", process.env.BACKEND_URI || "http://localhost:3000"],
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 60 * 24 * 30 // 30 days
		}
	},
	plugins: [
		magicLink({
			expiresIn: 600,
			sendMagicLink: async ({ email, token, url }, request) => {
				let locale = 'zh-Hant';
				try {
					const constructedUrl = new URL(url);
					const callbackURL = constructedUrl.searchParams.get('callbackURL');
					if (callbackURL) {
						const callbackUrl = new URL(callbackURL);
						const callbackPathParts = callbackUrl.pathname.split('/').filter(Boolean);
						if (callbackPathParts.length > 0 && ['en', 'zh-Hant', 'zh-Hans'].includes(callbackPathParts[0])) {
							locale = callbackPathParts[0];
						}
					}
				} catch (e) {
					console.error('Error parsing URL for locale:', e);
				}

				const frontendUrl = `${process.env.FRONTEND_URI || 'http://localhost:4321'}/${locale}/login/magic-link?token=${token}`;
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
				before: async (user) => {
					// Automatically assign admin role to specific email
					if (user.email === "hi@nelsongx.com") {
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
