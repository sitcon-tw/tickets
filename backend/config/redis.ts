import Redis from "ioredis";

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
		console.log("Redis is disabled or not configured, falling back to in-memory cache");
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
					console.warn("Redis connection failed after 3 attempts, falling back to in-memory cache");
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
			console.error("Redis client error:", err);
		});

		redis.on("connect", () => {
			console.log("Redis client connected");
		});

		redis.on("ready", () => {
			console.log("Redis client ready");
		});

		redis.connect().catch(err => {
			console.warn("Redis connection failed, falling back to in-memory cache:", err.message);
		});

		return redis;
	} catch (error) {
		console.error("Failed to initialize Redis client:", error);
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
