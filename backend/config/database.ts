import { logger } from "#utils/logger";
import { PrismaClient } from "@prisma/client";
import { PrismaExtensionRedis } from "prisma-extension-redis";
import { getRedisClient } from "./redis";
import { cacheConfig, parseRedisUri } from "./redis-cache";

const databaseLogger = logger.child({ component: "database" });

declare global {
	var prisma: PrismaClient | undefined;
}

/**
 * Initialize base Prisma client
 * Uses singleton pattern in development to prevent hot reload issues
 */
let basePrisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
	basePrisma = new PrismaClient();
} else {
	if (!globalThis.prisma) {
		globalThis.prisma = new PrismaClient();
	}
	basePrisma = globalThis.prisma;
}

const redis = getRedisClient();

/**
 * Extend Prisma client with Redis caching if available
 */
let prisma: PrismaClient;

if (redis && process.env.REDIS_URI) {
	const clientConfig = parseRedisUri(process.env.REDIS_URI);
	prisma = basePrisma.$extends(PrismaExtensionRedis({ config: cacheConfig, client: clientConfig })) as unknown as PrismaClient;
} else {
	prisma = basePrisma;
}

if (!redis && process.env.NODE_ENV !== "test") {
	databaseLogger.warn("Redis client not available - running without query caching");
}

export default prisma;
