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
				await sendMagicLink(email, url);
			}
		})
	],
	emailAndPassword: {
		enabled: false
	}
});
