import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

const usage = await prisma.referralUsage.findFirst({
	where: { registrationId: "cmgh3mrp900012k1yd3clf7h2" },
	select: {
		registration: {
			select: {
				ticketId: true,
				ticket: {
					select: {
						id: true,
						name: true
					}
				}
			}
		}
	}
});

console.log("ReferralUsage Result:", JSON.stringify(usage, null, 2));

// Also check the ticket directly
if (usage?.registration?.ticketId) {
	const ticket = await prisma.ticket.findUnique({
		where: { id: usage.registration.ticketId },
		select: {
			id: true,
			name: true
		}
	});
	console.log("\nDirect Ticket Query:", JSON.stringify(ticket, null, 2));
}

await prisma.$disconnect();
