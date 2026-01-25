export default async function generateHash(registrationId: string, registrationTime: Date | string) {
	const timeStr = registrationTime instanceof Date ? registrationTime.toISOString() : registrationTime;
	const text = registrationId + timeStr;
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}
