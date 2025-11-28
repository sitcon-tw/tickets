import Redis from "ioredis";

let redis;

/**
 * Get or create Redis client instance
 * Uses singleton pattern to reuse connection
 */
export function getRedisClient() {
	if (redis) {
		return redis;
	}

	// Skip Redis if disabled or no URL configured
	if (process.env.REDIS_DISABLED === "true" || !process.env.REDIS_URI) {
		console.log("Redis is disabled or not configured, falling back to in-memory cache");
		return null;
	}

	try {
		redis = new Redis(process.env.REDIS_URI, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true,
			connectTimeout: 5000, // 5 second connection timeout
			lazyConnect: true, // Don't connect immediately, wait for first command
			retryStrategy(times) {
				// Limit retry attempts during startup
				if (times > 3) {
					console.warn("Redis connection failed after 3 attempts, falling back to in-memory cache");
					return null; // Stop retrying
				}
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			reconnectOnError(err) {
				const targetError = "READONLY";
				if (err.message.includes(targetError)) {
					// Only reconnect when the error contains "READONLY"
					return true;
				}
				return false;
			}
		});

		redis.on("error", err => {
			console.error("Redis client error:", err);
			// Don't crash the app if Redis fails
		});

		redis.on("connect", () => {
			console.log("Redis client connected");
		});

		redis.on("ready", () => {
			console.log("Redis client ready");
		});

		// Connect asynchronously without blocking startup
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
export async function closeRedis() {
	if (redis) {
		await redis.quit();
		redis = null;
	}
}
