import crypto from "crypto";

export const generateEditToken = () => {
	return crypto.randomBytes(32).toString("hex");
};

export const hashToken = token => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

export const isTokenExpired = expiryDate => {
	return new Date() > new Date(expiryDate);
};

export const createEditTokenExpiry = (minutesFromNow = 30) => {
	const expiry = new Date();
	expiry.setMinutes(expiry.getMinutes() + minutesFromNow);
	return expiry;
};
