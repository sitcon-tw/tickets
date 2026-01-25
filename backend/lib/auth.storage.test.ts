import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import Redis from "ioredis";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createMemoryStorage, createRedisStorage } from "./auth.storage";

describe.concurrent("Memory Storage", () => {
	it.concurrent("should store and retrieve values", () => {
		const storage = createMemoryStorage();

		storage.set("test-key", "test-value");
		const value = storage.get("test-key");

		expect(value).toBe("test-value");
	});

	it.concurrent("should delete values", () => {
		const storage = createMemoryStorage();

		storage.set("test-key", "test-value");
		storage.delete("test-key");
		const value = storage.get("test-key");

		expect(value).toBeNull();
	});

	it.concurrent("should handle non-existent keys", () => {
		const storage = createMemoryStorage();

		const value = storage.get("non-existent-key");

		expect(value).toBeNull();
	});

	it.concurrent("should handle TTL correctly", async () => {
		const storage = createMemoryStorage();

		// Set with 1 second TTL
		storage.set("ttl-key", "ttl-value", 1);

		// Should be available immediately
		let value = storage.get("ttl-key");
		expect(value).toBe("ttl-value");

		// Wait for TTL to expire
		await new Promise(resolve => setTimeout(resolve, 1100));

		// Should be expired now
		value = storage.get("ttl-key");
		expect(value).toBeNull();
	});

	it.concurrent("should store values without TTL indefinitely", () => {
		const storage = createMemoryStorage();

		storage.set("no-ttl-key", "no-ttl-value");
		const value = storage.get("no-ttl-key");

		expect(value).toBe("no-ttl-value");
	});

	it.concurrent("should handle multiple keys independently", () => {
		const storage = createMemoryStorage();

		storage.set("key1", "value1");
		storage.set("key2", "value2");
		storage.set("key3", "value3");

		expect(storage.get("key1")).toBe("value1");
		expect(storage.get("key2")).toBe("value2");
		expect(storage.get("key3")).toBe("value3");

		storage.delete("key2");

		expect(storage.get("key1")).toBe("value1");
		expect(storage.get("key2")).toBeNull();
		expect(storage.get("key3")).toBe("value3");
	});

	it.concurrent("should cleanup expired entries when accessed", async () => {
		const storage = createMemoryStorage();

		storage.set("expire-key", "expire-value", 1);

		// Wait for expiration
		await new Promise(resolve => setTimeout(resolve, 1100));

		// Access should cleanup and return null
		const value = storage.get("expire-key");
		expect(value).toBeNull();

		// Verify it's actually deleted
		const valueAgain = storage.get("expire-key");
		expect(valueAgain).toBeNull();
	});
});

describe("Redis Storage", () => {
	let container: StartedRedisContainer;
	let redis: Redis;

	beforeAll(async () => {
		// Start Redis container
		container = await new RedisContainer("redis:8").start();

		// Create Redis client
		redis = new Redis({
			host: container.getHost(),
			port: container.getPort()
		});
	});

	afterAll(async () => {
		// Cleanup
		await redis.quit();
		await container.stop();
	});

	beforeEach(async () => {
		// Clear all keys before each test
		await redis.flushall();
	});

	it("should store and retrieve values", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("test-key", "test-value");
		const value = await storage.get("test-key");

		expect(value).toBe("test-value");
	});

	it("should delete values", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("test-key", "test-value");
		await storage.delete("test-key");
		const value = await storage.get("test-key");

		expect(value).toBeNull();
	});

	it("should handle non-existent keys", async () => {
		const storage = createRedisStorage(redis);

		const value = await storage.get("non-existent-key");

		expect(value).toBeNull();
	});

	it("should use correct key prefix", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("my-key", "my-value");

		// Check that the key is stored with the prefix
		const directValue = await redis.get("better-auth:my-key");
		expect(directValue).toBe("my-value");
	});

	it("should handle TTL correctly", async () => {
		const storage = createRedisStorage(redis);

		// Set with 2 second TTL
		await storage.set("ttl-key", "ttl-value", 2);

		// Should be available immediately
		let value = await storage.get("ttl-key");
		expect(value).toBe("ttl-value");

		// Check TTL is set
		const ttl = await redis.ttl("better-auth:ttl-key");
		expect(ttl).toBeGreaterThan(0);
		expect(ttl).toBeLessThanOrEqual(2);

		// Wait for TTL to expire
		await new Promise(resolve => setTimeout(resolve, 2100));

		// Should be expired now
		value = await storage.get("ttl-key");
		expect(value).toBeNull();
	});

	it("should store values without TTL indefinitely", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("no-ttl-key", "no-ttl-value");

		// Check that no TTL is set
		const ttl = await redis.ttl("better-auth:no-ttl-key");
		expect(ttl).toBe(-1); // -1 means no expiration

		const value = await storage.get("no-ttl-key");
		expect(value).toBe("no-ttl-value");
	});

	it("should handle multiple keys independently", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("key1", "value1");
		await storage.set("key2", "value2");
		await storage.set("key3", "value3");

		expect(await storage.get("key1")).toBe("value1");
		expect(await storage.get("key2")).toBe("value2");
		expect(await storage.get("key3")).toBe("value3");

		await storage.delete("key2");

		expect(await storage.get("key1")).toBe("value1");
		expect(await storage.get("key2")).toBeNull();
		expect(await storage.get("key3")).toBe("value3");
	});

	it("should update existing values", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("update-key", "original-value");
		expect(await storage.get("update-key")).toBe("original-value");

		await storage.set("update-key", "updated-value");
		expect(await storage.get("update-key")).toBe("updated-value");
	});

	it("should update TTL when resetting a key", async () => {
		const storage = createRedisStorage(redis);

		await storage.set("ttl-update-key", "value1", 5);

		// Wait a bit
		await new Promise(resolve => setTimeout(resolve, 1000));

		// Reset with new TTL
		await storage.set("ttl-update-key", "value2", 10);

		// Check new TTL
		const ttl = await redis.ttl("better-auth:ttl-update-key");
		expect(ttl).toBeGreaterThan(8);
		expect(ttl).toBeLessThanOrEqual(10);
	});
});
