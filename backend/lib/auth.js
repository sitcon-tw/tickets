import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { PrismaClient } from "../generated/prisma/index.js";
import { MailtrapClient } from "mailtrap"

const prisma = new PrismaClient();

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "sqlite",
    }),
    baseURL: process.env.BACKEND_URI || "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [process.env.FRONTEND_URI || "http://localhost:4321", process.env.BACKEND_URI || "http://localhost:3000"],
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 24 * 30, // 30 days
        }
    },
    plugins: [
        magicLink({
            expiresIn: 600,
            sendMagicLink: async ({ email, token, url }, request) => {
                const TOKEN = process.env.MAILTRAP_TOKEN;
                const SENDER_EMAIL = process.env.MAILTRAP_SENDER_EMAIL;
                const RECIPIENT_EMAIL = email;

                const client = new MailtrapClient({ token: TOKEN });

                const sender = { name: "Mailtrap Test", email: SENDER_EMAIL };

                await client
                    .send({
                        from: sender,
                        to: [{ email: RECIPIENT_EMAIL }],
                        subject: "Hello from Mailtrap!",
                        text: "Welcome to Mailtrap Sending! Your magic link is: " + url,
                    })
                        .then(console.log)
                        .catch(console.error);
            }
        })
    ],
    emailAndPassword: {
        enabled: false,
    },
});