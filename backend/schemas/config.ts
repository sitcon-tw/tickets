import { z } from "zod";

/**
 * Configuration Zod schemas
 * Backend-only configuration types
 */

// RedisClientConfig schema
export const redisClientConfigSchema = z.object({
	host: z.string(),
	port: z.number().int().positive(),
	password: z.string().optional(),
	username: z.string().optional(),
	db: z.number().int().nonnegative().optional(),
});

/**
 * Type exports
 */
export type RedisClientConfig = z.infer<typeof redisClientConfigSchema>;
