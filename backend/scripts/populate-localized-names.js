/**
 * Script to populate empty localized name/description fields for tickets and events
 * Run with: node scripts/populate-localized-names.js
 */

import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function populateLocalizedNames() {
	console.log('Starting to populate localized names...\n');

	try {
		// Get all tickets with empty name objects
		const tickets = await prisma.ticket.findMany({
			select: {
				id: true,
				name: true,
				description: true,
			}
		});

		console.log(`Found ${tickets.length} tickets`);

		for (const ticket of tickets) {
			const updates = {};
			let needsUpdate = false;

			// Check if name is empty object
			if (!ticket.name || Object.keys(ticket.name).length === 0) {
				updates.name = {
					en: `Ticket ${ticket.id.substring(0, 8)}`,
					'zh-Hant': `票券 ${ticket.id.substring(0, 8)}`,
					'zh-Hans': `票券 ${ticket.id.substring(0, 8)}`
				};
				needsUpdate = true;
				console.log(`  - Ticket ${ticket.id}: Adding name`);
			}

			// Check if description is empty object
			if (!ticket.description || Object.keys(ticket.description).length === 0) {
				updates.description = {
					en: 'Please update this ticket description',
					'zh-Hant': '請更新此票券說明',
					'zh-Hans': '请更新此票券说明'
				};
				needsUpdate = true;
				console.log(`  - Ticket ${ticket.id}: Adding description`);
			}

			// Update if needed
			if (needsUpdate) {
				await prisma.ticket.update({
					where: { id: ticket.id },
					data: updates
				});
			}
		}

		// Get all events with empty name objects
		const events = await prisma.event.findMany({
			select: {
				id: true,
				name: true,
				description: true,
			}
		});

		console.log(`\nFound ${events.length} events`);

		for (const event of events) {
			const updates = {};
			let needsUpdate = false;

			// Check if name is empty object
			if (!event.name || Object.keys(event.name).length === 0) {
				updates.name = {
					en: `Event ${event.id.substring(0, 8)}`,
					'zh-Hant': `活動 ${event.id.substring(0, 8)}`,
					'zh-Hans': `活动 ${event.id.substring(0, 8)}`
				};
				needsUpdate = true;
				console.log(`  - Event ${event.id}: Adding name`);
			}

			// Check if description is empty object
			if (!event.description || Object.keys(event.description).length === 0) {
				updates.description = {
					en: 'Please update this event description',
					'zh-Hant': '請更新此活動說明',
					'zh-Hans': '请更新此活动说明'
				};
				needsUpdate = true;
				console.log(`  - Event ${event.id}: Adding description`);
			}

			// Update if needed
			if (needsUpdate) {
				await prisma.event.update({
					where: { id: event.id },
					data: updates
				});
			}
		}

		// Get all ticket form fields with empty name objects
		const formFields = await prisma.ticketFromFields.findMany({
			select: {
				id: true,
				name: true,
				description: true,
			}
		});

		console.log(`\nFound ${formFields.length} form fields`);

		for (const field of formFields) {
			const updates = {};
			let needsUpdate = false;

			// Check if name is empty object
			if (!field.name || Object.keys(field.name).length === 0) {
				// Use description as fallback if available
				const fallbackName = field.description || `Field ${field.id.substring(0, 8)}`;
				updates.name = {
					en: fallbackName,
					'zh-Hant': fallbackName,
					'zh-Hans': fallbackName
				};
				needsUpdate = true;
				console.log(`  - Form Field ${field.id}: Adding name`);
			}

			// Update if needed
			if (needsUpdate) {
				await prisma.ticketFromFields.update({
					where: { id: field.id },
					data: updates
				});
			}
		}

		console.log('\n✓ Successfully populated localized names!');
	} catch (error) {
		console.error('Error populating localized names:', error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
populateLocalizedNames()
	.then(() => {
		console.log('\nDone!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	});
