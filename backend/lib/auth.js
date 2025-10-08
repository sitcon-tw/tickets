import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { PrismaClient } from "../generated/prisma/index.js";
import { sendMagicLink } from "#utils/email.js";
import { getAdminEmails } from "../config/security.js";

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
		},
		cookieOptions: {
			sameSite: "lax", // Use Lax for same-origin via proxy
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			path: "/"
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

				// Send users to frontend, which will proxy the verification to backend
				const frontendUrl = `${process.env.FRONTEND_URI || 'http://localhost:4321'}/api/auth/magic-link/verify?token=${token}&locale=${locale}`;
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
					// Automatically assign admin role to emails specified in ADMIN_EMAILS env var
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
