/**
 * System and infrastructure types
 */

import { z } from "zod/v4";

/**
 * Health status
 */
export const HealthStatusSchema = z.object({
	status: z.enum(["ok", "error"]),
	timestamp: z.string().datetime(),
	version: z.string().optional()
});
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

/**
 * Redis client config
 */
export const RedisClientConfigSchema = z.object({
	host: z.string(),
	port: z.number().int().min(1).max(65535),
	password: z.string().optional(),
	username: z.string().optional(),
	db: z.number().int().min(0).optional()
});
export type RedisClientConfig = z.infer<typeof RedisClientConfigSchema>;

/**
 * Export data response
 */
export const ExportDataSchema = z.object({
	downloadUrl: z.string().url(),
	filename: z.string(),
	count: z.number().int().min(0)
});
export type ExportData = z.infer<typeof ExportDataSchema>;
