/**
 * @fileoverview QR Code utilities for registration and check-in
 * 
 * PRODUCTION NOTE: This module uses placeholder implementations.
 * For production use, install a QR code library such as:
 * - npm install qrcode
 * - npm install qr-image  
 * - npm install node-qrcode
 */

import crypto from 'crypto';

/**
 * Generate a QR code data URL (placeholder implementation)
 * @param {string} data - Data to encode in QR code
 * @returns {string} Data URL for the QR code
 * 
 * TODO: Replace with actual QR code generation using a library like 'qrcode'
 * Example implementation:
 * import QRCode from 'qrcode';
 * return await QRCode.toDataURL(data, { width: 200, margin: 2 });
 */
export const generateQRCodeDataURL = (data) => {
	if (!data || typeof data !== 'string') {
		throw new Error('QR code data must be a non-empty string');
	}

	// Enhanced placeholder SVG QR code
	const size = 200;
	const padding = 20;
	const innerSize = size - (padding * 2);
	
	// Create a simple visual representation
	const hash = crypto.createHash('md5').update(data).digest('hex');
	const pattern = hash.split('').map(char => parseInt(char, 16) % 2).join('');
	
	let squares = '';
	const gridSize = 8;
	const squareSize = innerSize / gridSize;
	
	for (let i = 0; i < gridSize; i++) {
		for (let j = 0; j < gridSize; j++) {
			const index = (i * gridSize + j) % pattern.length;
			if (pattern[index] === '1') {
				const x = padding + (j * squareSize);
				const y = padding + (i * squareSize);
				squares += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="black"/>`;
			}
		}
	}

	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
			<rect width="${size}" height="${size}" fill="white" stroke="black" stroke-width="2"/>
			${squares}
			<text x="${size/2}" y="${size-5}" text-anchor="middle" font-family="monospace" font-size="8" fill="gray">${data}</text>
		</svg>
	`.trim();

	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * Generate a unique registration/check-in ID
 * @returns {string} Unique 12-character alphanumeric ID
 */
export const generateRegistrationId = () => {
	// Use crypto for better randomness
	const buffer = crypto.randomBytes(9);
	return buffer.toString('base64')
		.replace(/[+/]/g, '')
		.substring(0, 12)
		.toUpperCase();
};

/**
 * Validate QR code data format
 * @param {string} data - QR code data to validate
 * @returns {boolean} True if valid format
 */
export const validateQRCodeData = (data) => {
	if (!data || typeof data !== 'string') return false;
	if (data.length < 8 || data.length > 64) return false;
	return /^[A-Z0-9]+$/.test(data);
};