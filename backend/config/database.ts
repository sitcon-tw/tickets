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

interface RedisClientConfig {
	host: string;
	port: number;
	password?: string;
	username?: string;
	db?: number;
}

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

	prisma = basePrisma.$extends(PrismaExtensionRedis({ config, client: clientConfig })) as unknown as PrismaClient;
} else {
	prisma = basePrisma;
}

if (!redis && process.env.NODE_ENV !== "test") {
	console.warn("Redis client not available - running without query caching");
}

export default prisma;
