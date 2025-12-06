import { PrismaClient } from "@prisma/client";
import { PrismaExtensionRedis } from "prisma-extension-redis";
import { getRedisClient } from "./redis";

declare global {
	var prisma: PrismaClient | undefined;
}

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

const auto = {
	excludedModels: [],
	excludedOperations: [],
	models: [
		{
			model: "Event",
			ttl: 100,
			stale: 5
		},
		{
			model: "Ticket",
			ttl: 300,
			stale: 1
		},
		{
			model: "EventFormFields",
			ttl: 100,
			stale: 5
		}
	],
	ttl: 0
};

const config = {
	ttl: 0,
	stale: 0,
	type: "JSON" as const,
	auto,
	logger: process.env.REDIS_DEBUG === "true" ? console : undefined,
	cacheKey: {
		delimiter: ":",
		case: "snake_case",
		prefix: "prisma"
	}
};

import type { RedisClientConfig } from "../types/database";

/**
 * Prisma extension to handle duplicate user creation gracefully
 *
 * Better Auth's magic link flow may attempt to create a user that already exists,
 * which would trigger a P2002 unique constraint error. This extension catches
 * that error and returns the existing user instead, allowing the authentication
 * flow to continue seamlessly.
 */
const handleDuplicateUserExtension = {
	name: "handleDuplicateUser",
	query: {
		async $allOperations({ operation, model, args, query }: any) {
			try {
				return await query(args);
			} catch (error: any) {
				// Catch unique constraint violations on user email field
				if (error.code === "P2002" && model === "User" && operation === "create" && error.meta?.target?.includes("email")) {
					const email = args.data?.email;
					if (email) {
						const existingUser = await basePrisma.user.findUnique({
							where: { email }
						});
						if (existingUser) {
							return existingUser;
						}
					}
				}
				throw error;
			}
		}
	}
};

let prisma: PrismaClient;
if (redis && process.env.REDIS_URI) {
	const url = new URL(process.env.REDIS_URI);

	const clientConfig: RedisClientConfig = {
		host: url.hostname,
		port: parseInt(url.port) || 6379
	};

	if (url.password) {
		clientConfig.password = url.password;
	}
	if (url.username) {
		clientConfig.username = url.username;
	}
	if (url.pathname && url.pathname.length > 1) {
		const db = parseInt(url.pathname.substring(1));
		if (!isNaN(db)) {
			clientConfig.db = db;
		}
	}

	prisma = basePrisma.$extends(handleDuplicateUserExtension).$extends(PrismaExtensionRedis({ config, client: clientConfig })) as unknown as PrismaClient;
} else {
	prisma = basePrisma.$extends(handleDuplicateUserExtension) as unknown as PrismaClient;
}

if (!redis && process.env.NODE_ENV !== "test") {
	console.warn("Redis client not available - running without query caching");
}

export default prisma;
