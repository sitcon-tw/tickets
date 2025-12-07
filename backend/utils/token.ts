import crypto from "crypto";

export const generateEditToken = (): string => {
	return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string): string => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

export const isTokenExpired = (expiryDate: Date | string): boolean => {
	return new Date() > new Date(expiryDate);
};

export const createEditTokenExpiry = (minutesFromNow: number = 30): Date => {
	const expiry = new Date();
	expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
	return expiry;
};
