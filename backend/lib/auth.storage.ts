import { getRedisClient } from "#config/redis";
import type { SecondaryStorage } from "better-auth";
import type { Redis } from "ioredis";

export function createSecondaryStorage(): SecondaryStorage {
	const redis = getRedisClient();
	if (redis) {
		return createRedisStorage(redis);
	}
	return createMemoryStorage();
}

/**
 * Create a Redis storage for storing session and rate limit data.
 */
export function createRedisStorage(redis: Redis): SecondaryStorage {
	const prefix = "better-auth:";

	return {
		async get(key) {
			return await redis.get(`${prefix}${key}`);
		},
		async set(key, value, ttl) {
			if (ttl) {
				await redis.set(`${prefix}${key}`, value, "EX", ttl);
			} else {
				await redis.set(`${prefix}${key}`, value);
			}
		},
		async delete(key) {
			await redis.del(`${prefix}${key}`);
		}
	};
}

/**
 * Create a memory storage for storing session and rate limit data for development.
 */
export function createMemoryStorage(): SecondaryStorage {
	const memoryStorage: Record<string, string> = {};
	const expiredAt: Record<string, Date> = {};

	return {
		get(key) {
			if (expiredAt[key] && expiredAt[key] < new Date()) {
				delete memoryStorage[key];
				delete expiredAt[key];
				return null;
			}
			return memoryStorage[key] ?? null;
		},
		set(key, value, ttl) {
			memoryStorage[key] = value;
			if (ttl) {
				expiredAt[key] = new Date(Date.now() + ttl * 1000);
			}
		},
		delete(key) {
			delete memoryStorage[key];
		}
	};
}
