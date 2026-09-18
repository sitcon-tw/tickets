import { SessionSchema, type Session } from "@sitcontix/types";
import { cookies } from "next/headers";

function getBackendUrl() {
	return process.env.BACKEND_URI || "http://localhost:3000";
}

export async function getServerSession(): Promise<Session | null> {
	const cookieHeader = (await cookies()).toString();

	try {
		const response = await fetch(`${getBackendUrl()}/api/auth/get-session`, {
			headers: cookieHeader ? { cookie: cookieHeader } : {},
			cache: "no-store"
		});

		if (!response.ok) return null;

		const data = await response.json();
		const parsed = SessionSchema.nullable().optional().safeParse(data);
		return parsed.success ? parsed.data || null : null;
	} catch {
		return null;
	}
}
