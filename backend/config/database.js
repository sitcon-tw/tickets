import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaExtensionRedis } from "prisma-extension-redis";
import { getRedisClient } from "./redis.js";

let basePrisma;

if (process.env.NODE_ENV === "production") {
	basePrisma = new PrismaClient();
} else {
	if (!globalThis.prisma) {
		globalThis.prisma = new PrismaClient();
	}
	basePrisma = globalThis.prisma;
}

// Configure Redis caching extension
const redis = getRedisClient();

// Configure auto-caching behavior
const auto = {
	excludedModels: [], // No models excluded by default
	excludedOperations: [], // Cache all operations
	models: [
		{
			model: "Event",
			ttl: 10, // Cache events for 10 seconds (basic info, rarely changes during registration rush)
			stale: 5 // Allow using stale data for 5 seconds after expiration
		},
		{
			model: "Ticket",
			ttl: 3, // Cache tickets for 3 seconds (availability needs to be relatively fresh)
			stale: 1 // Minimal stale period for ticket availability
		},
		{
			model: "TicketFromFields",
			ttl: 10, // Cache ticket form fields for 10 seconds (static data)
			stale: 5
		}
	],
	ttl: 0 // Default: don't cache anything not explicitly listed above
};

// Configure storage settings
const config = {
	ttl: 0, // Default TTL (disabled unless model-specific)
	stale: 0,
	auto,
	logger: process.env.REDIS_DEBUG === "true" ? console : undefined
};

// Apply Redis caching extension or use base Prisma client
// The extension accepts an ioredis client directly
const prisma = redis
	? basePrisma.$extends(PrismaExtensionRedis({ config, client: redis }))
	: basePrisma;

if (!redis && process.env.NODE_ENV !== "test") {
	console.warn("Redis client not available - running without query caching");
}

export default prisma;
