/**
 * Script to fix empty localized name/description fields
 * Run with: node scripts/fix-empty-names.js
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

function isEmpty(obj) {
	if (!obj) return true;
	if (typeof obj !== "object") return true;
	return Object.keys(obj).length === 0;
}

async function fixEmptyNames() {
	console.log("Starting to fix empty localized names...\n");

	try {
		// Get all tickets
		const tickets = await prisma.ticket.findMany({
			select: {
				id: true,
				name: true,
				description: true
			}
		});

		console.log(`Found ${tickets.length} tickets`);
		let ticketsUpdated = 0;

		for (const ticket of tickets) {
			const updates = {};

			console.log(`\nTicket ${ticket.id}:`);
			console.log(`  Current name:`, JSON.stringify(ticket.name));
			console.log(`  Current description:`, JSON.stringify(ticket.description));

			// Always update if empty
			if (isEmpty(ticket.name)) {
				updates.name = {
					en: `Ticket ${ticket.id.substring(0, 8)}`,
					"zh-Hant": `票券 ${ticket.id.substring(0, 8)}`,
					"zh-Hans": `票券 ${ticket.id.substring(0, 8)}`
				};
				console.log(`  → Will update name to:`, JSON.stringify(updates.name));
			}

			if (isEmpty(ticket.description)) {
				updates.description = {
					en: "Please update this ticket description",
					"zh-Hant": "請更新此票券說明",
					"zh-Hans": "请更新此票券说明"
				};
				console.log(`  → Will update description`);
			}

			// Update if needed
			if (Object.keys(updates).length > 0) {
				await prisma.ticket.update({
					where: { id: ticket.id },
					data: updates
				});
				ticketsUpdated++;
				console.log(`  ✓ Updated`);
			} else {
				console.log(`  - No update needed`);
			}
		}

		// Get all events
		const events = await prisma.event.findMany({
			select: {
				id: true,
				name: true,
				description: true
			}
		});

		console.log(`\n\nFound ${events.length} events`);
		let eventsUpdated = 0;

		for (const event of events) {
			const updates = {};

			console.log(`\nEvent ${event.id}:`);
			console.log(`  Current name:`, JSON.stringify(event.name));
			console.log(`  Current description:`, JSON.stringify(event.description));

			if (isEmpty(event.name)) {
				updates.name = {
					en: `Event ${event.id.substring(0, 8)}`,
					"zh-Hant": `活動 ${event.id.substring(0, 8)}`,
					"zh-Hans": `活动 ${event.id.substring(0, 8)}`
				};
				console.log(`  → Will update name to:`, JSON.stringify(updates.name));
			}

			if (isEmpty(event.description)) {
				updates.description = {
					en: "Please update this event description",
					"zh-Hant": "請更新此活動說明",
					"zh-Hans": "请更新此活动说明"
				};
				console.log(`  → Will update description`);
			}

			if (Object.keys(updates).length > 0) {
				await prisma.event.update({
					where: { id: event.id },
					data: updates
				});
				eventsUpdated++;
				console.log(`  ✓ Updated`);
			} else {
				console.log(`  - No update needed`);
			}
		}

		// Get all form fields
		const formFields = await prisma.ticketFromFields.findMany({
			select: {
				id: true,
				name: true,
				description: true
			}
		});

		console.log(`\n\nFound ${formFields.length} form fields`);
		let fieldsUpdated = 0;

		for (const field of formFields) {
			const updates = {};

			console.log(`\nForm Field ${field.id}:`);
			console.log(`  Current name:`, JSON.stringify(field.name));
			console.log(`  Current description:`, field.description);

			if (isEmpty(field.name)) {
				const fallbackName = field.description || `Field ${field.id.substring(0, 8)}`;
				updates.name = {
					en: fallbackName,
					"zh-Hant": fallbackName,
					"zh-Hans": fallbackName
				};
				console.log(`  → Will update name to:`, JSON.stringify(updates.name));
			}

			if (Object.keys(updates).length > 0) {
				await prisma.ticketFromFields.update({
					where: { id: field.id },
					data: updates
				});
				fieldsUpdated++;
				console.log(`  ✓ Updated`);
			} else {
				console.log(`  - No update needed`);
			}
		}

		console.log("\n\n=== SUMMARY ===");
		console.log(`Tickets updated: ${ticketsUpdated}/${tickets.length}`);
		console.log(`Events updated: ${eventsUpdated}/${events.length}`);
		console.log(`Form fields updated: ${fieldsUpdated}/${formFields.length}`);
		console.log("\n✓ Done!");
	} catch (error) {
		console.error("Error:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
fixEmptyNames()
	.then(() => {
		process.exit(0);
	})
	.catch(error => {
		console.error("Script failed:", error);
		process.exit(1);
	});
