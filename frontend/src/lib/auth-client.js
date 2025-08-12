import { createAuthClient } from "better-auth/client";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
	baseURL: process.env.FRONTEND_URI || "http://localhost:4321",
	fetchOptions: {
		credentials: "include"
	},
	plugins: [magicLinkClient()]
});

export const { signIn, signOut, useSession, signUp } = authClient;
