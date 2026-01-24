import { logger } from "#utils/logger";
import Redis from "ioredis";

const redisLogger = logger.child({ component: "redis" });

let redis: Redis | null = null;

/**
 * Get or create Redis client instance
 * Uses singleton pattern to reuse connection
 */
export function getRedisClient(): Redis | null {
	if (redis) {
		return redis;
	}

	if (process.env.REDIS_DISABLED === "true" || !process.env.REDIS_URI) {
		redisLogger.info("Redis is disabled or not configured, falling back to in-memory cache");
		return null;
	}

	try {
		redis = new Redis(process.env.REDIS_URI, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			connectTimeout: 5000,
			lazyConnect: true,
			retryStrategy(times: number): number | null {
				if (times > 3) {
					redisLogger.warn("Redis connection failed after 3 attempts, falling back to in-memory cache");
					return null;
				}
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			reconnectOnError(err: Error): boolean {
				const targetError = "READONLY";
				if (err.message.includes(targetError)) {
					return true;
				}
				return false;
			}
		});

		redis.on("error", err => {
			redisLogger.error({ error: err }, "Redis client error");
		});

		redis.on("connect", () => {
			redisLogger.info("Redis client connected");
		});

		redis.on("ready", () => {
			redisLogger.info("Redis client ready");
		});

		redis.connect().catch(err => {
			redisLogger.warn({ error: err }, "Redis connection failed, falling back to in-memory cache");
		});

		return redis;
	} catch (error) {
		redisLogger.error({ error }, "Failed to initialize Redis client");
		return null;
	}
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
	if (redis) {
		await redis.quit();
		redis = null;
	}
}
