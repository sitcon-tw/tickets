import { PrismaClient } from "#prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
	connectionString: process.env.POSTGRES_URI
});

const prisma = new PrismaClient({ adapter });

export default prisma;
