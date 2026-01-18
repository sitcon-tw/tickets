import type { RedisClientConfig } from "@sitcontix/types";
import type { AutoCacheConfig, CacheConfig } from "prisma-extension-redis";
import { CacheCase } from "prisma-extension-redis";

/**
 * Parse Redis URI into client configuration
 * Extracts host, port, username, password, and database from Redis connection string
 */
export function parseRedisUri(uri: string): RedisClientConfig {
	const url = new URL(uri);

	const config: RedisClientConfig = {
		host: url.hostname,
		port: parseInt(url.port) || 6379
	};

	if (url.password) {
		config.password = url.password;
	}
	if (url.username) {
		config.username = url.username;
	}
	if (url.pathname && url.pathname.length > 1) {
		const db = parseInt(url.pathname.substring(1));
		if (!isNaN(db)) {
			config.db = db;
		}
	}

	return config;
}

/**
 * Auto-cache configuration
 * Defines which models should be automatically cached and their TTL/stale settings
 */
export const autoCacheConfig: AutoCacheConfig = {
	excludedModels: [], // Models to exclude from auto-caching
	excludedOperations: [], // Operations to exclude from auto-caching (e.g., 'findFirst', 'count')
	models: [
		{
			model: "Event",
			ttl: 100, // Cache for 100 seconds
			stale: 5 // Allow stale data for 5 seconds while refreshing
		},
		{
			model: "Ticket",
			ttl: 300, // Cache for 5 minutes
			stale: 1
		},
		{
			model: "EventFormFields",
			ttl: 100,
			stale: 5
		}
	],
	ttl: 0 // Default TTL for auto-cached queries (0 = disabled by default)
};

/**
 * Cache configuration for Prisma Extension Redis
 * Controls caching behavior, key generation, and serialization
 */
export const cacheConfig: CacheConfig = {
	ttl: 0, // Default TTL in seconds (0 = no default caching)
	stale: 0, // Default stale time in seconds
	type: "JSON", // Store data as JSON in Redis (requires RedisJSON module)
	auto: autoCacheConfig,
	logger: process.env.REDIS_DEBUG === "true" ? console : undefined,
	cacheKey: {
		delimiter: ":", // Key delimiter (e.g., "prisma:event:123")
		case: CacheCase.SNAKE_CASE, // Convert keys to snake_case
		prefix: "prisma" // Key prefix for all cached entries
	}
};
