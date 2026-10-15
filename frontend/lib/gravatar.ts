import crypto from "crypto";
import { z } from "zod/v4";

function md5(input: string): string {
	return crypto.createHash("md5").update(input).digest("hex");
}

const GravatarProfileSchema = z.object({
	displayName: z.string().optional().catch(undefined),
	name: z
		.object({
			formatted: z.string().optional().catch(undefined),
			givenName: z.string().optional().catch(undefined),
			familyName: z.string().optional().catch(undefined)
		})
		.optional()
		.catch(undefined),
	preferredUsername: z.string().optional().catch(undefined)
});
export type GravatarProfile = z.infer<typeof GravatarProfileSchema>;

const GravatarResponseSchema = z.object({ entry: z.array(GravatarProfileSchema).optional() });

export async function fetchGravatarName(email: string): Promise<string | null> {
	try {
		const normalizedEmail = email.trim().toLowerCase();
		const hash = md5(normalizedEmail);
		const response = await fetch(`https://gravatar.com/${hash}.json`);

		if (!response.ok) {
			return null;
		}

		const parsed = GravatarResponseSchema.safeParse(await response.json());
		const profile = parsed.success ? parsed.data.entry?.[0] : undefined;

		if (!profile) {
			return null;
		}

		return profile.displayName || profile.name?.formatted || profile.preferredUsername || null;
	} catch (error) {
		console.error("Error fetching Gravatar profile:", error);
		return null;
	}
}
