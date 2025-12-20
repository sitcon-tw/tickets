import crypto from "crypto";

function md5(input: string): string {
	return crypto.createHash("md5").update(input).digest("hex");
}

export interface GravatarProfile {
	displayName?: string;
	name?: {
		formatted?: string;
		givenName?: string;
		familyName?: string;
	};
	preferredUsername?: string;
}

export async function fetchGravatarName(email: string): Promise<string | null> {
	try {
		const normalizedEmail = email.trim().toLowerCase();
		const hash = md5(normalizedEmail);
		const response = await fetch(`https://gravatar.com/${hash}.json`);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		const profile = data.entry?.[0] as GravatarProfile;

		if (!profile) {
			return null;
		}

		return profile.displayName || profile.name?.formatted || profile.preferredUsername || null;
	} catch (error) {
		console.error("Error fetching Gravatar profile:", error);
		return null;
	}
}
