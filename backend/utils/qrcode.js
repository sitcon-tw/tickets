import fs from 'fs/promises';
import path from 'path';

// TODO: Implement actual QR code generation

// Simple QR code generation using HTML canvas approach
// In a production environment, you might want to use a proper QR code library like 'qrcode'
export const generateQRCodeDataURL = (data) => {
	// For now, return a placeholder data URL
	// In production, implement actual QR code generation
	const encodedData = encodeURIComponent(data);
	return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="black">${encodedData}</text></svg>`;
};

export const generateQRCodeFile = async (data, filename) => {
	try {
		// Create uploads directory if it doesn't exist
		const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'qrcodes');
		await fs.mkdir(uploadsDir, { recursive: true });

		// For now, create a simple text file as placeholder
		// In production, generate actual QR code image
		const filePath = path.join(uploadsDir, `${filename}.txt`);
		await fs.writeFile(filePath, `QR Code for: ${data}`);

		return `/uploads/qrcodes/${filename}.txt`;
	} catch (error) {
		console.error('QR code generation error:', error);
		throw error;
	}
};

export const generateCheckInCode = () => {
	// Generate a unique alphanumeric check-in code (8 characters)
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};