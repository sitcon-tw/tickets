import prisma from "#config/database";
import type { Event, Ticket } from "#prisma/generated/prisma/client";
import { logger } from "#utils/logger";

const componentLogger = logger.child({ component: "database-init" });

export async function initializeDatabase(): Promise<void> {
	try {
		componentLogger.info("Checking database initialization...");

		const eventCount = await prisma.event.count();

		if (eventCount === 0) {
			componentLogger.info("No events found, creating default event: SITCON 2026");

			const defaultEvent: Event = await prisma.event.create({
				data: {
					name: "SITCON 2026",
					description: "Students' Information Technology Conference 2026",
					startDate: new Date("2026-03-08T09:00:00.000Z"),
					endDate: new Date("2026-03-08T18:00:00.000Z"),
					isActive: true,
					landingPage: JSON.stringify({
						hero: {
							title: "SITCON 2026",
							subtitle: "Students' Information Technology Conference",
							description: "學生計算機年會"
						}
					})
				}
			});

			componentLogger.info({ name: defaultEvent.name, id: defaultEvent.id }, "Created default event");

			const defaultTickets = [
				{
					name: "學生票",
					description: "學生保留名額。報到時請攜帶學生證或相關身分證件。",
					price: 0,
					quantity: 100,
					requireInviteCode: false
				},
				{
					name: "個人票",
					description: "一般參與者票種",
					price: 500,
					quantity: 200,
					requireInviteCode: false
				},
				{
					name: "贊助票",
					description: "支持 SITCON 的朋友",
					price: 1500,
					quantity: 50,
					requireInviteCode: false
				},
				{
					name: "邀請票",
					description: "講者與工作人員專用",
					price: 0,
					quantity: 30,
					requireInviteCode: true
				}
			];

			for (const ticketData of defaultTickets) {
				const ticket: Ticket = await prisma.ticket.create({
					data: {
						...ticketData,
						eventId: defaultEvent.id,
						saleStart: new Date("2025-12-01T00:00:00.000Z"),
						saleEnd: new Date("2026-02-28T23:59:59.000Z")
					}
				});
				componentLogger.info({ name: ticket.name, id: ticket.id }, "Created ticket");
			}

			componentLogger.info("🎉 Database initialized with default data!");
		} else {
			componentLogger.info({ eventCount }, "Database already initialized");
		}
	} catch (error) {
		componentLogger.error({ error }, "❌ Failed to initialize database:");
		throw error;
	}
}

export async function cleanup(): Promise<void> {
	await prisma.$disconnect();
}
