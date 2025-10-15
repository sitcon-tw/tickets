import { PrismaClient } from "../generated/prisma/index.js";
import { createPrismaRedisCache } from "prisma-redis-middleware";
import { getRedisClient } from "./redis.js";

let prisma;

if (process.env.NODE_ENV === "production") {
	prisma = new PrismaClient();
} else {
	if (!globalThis.prisma) {
		globalThis.prisma = new PrismaClient();
	}
	prisma = globalThis.prisma;
}

// Configure Redis caching middleware
const redis = getRedisClient();

const cacheMiddleware = createPrismaRedisCache({
	models: [
		// Cache events for 10 seconds (basic info, rarely changes during registration rush)
		{ model: "Event", cacheTime: 10 },
		// Cache tickets for 2-3 seconds (availability needs to be relatively fresh)
		{ model: "Ticket", cacheTime: 3 },
		// Cache ticket form fields for 10 seconds (static data)
		{ model: "TicketFromFields", cacheTime: 10 },
		// Cache users for 5 seconds
		{ model: "User", cacheTime: 5 },
		// Cache invitation codes for 2 seconds (usage counts must be fresh)
		{ model: "InvitationCode", cacheTime: 2 },
		// Cache referrals for 5 seconds
		{ model: "Referral", cacheTime: 5, invalidateRelated: ["ReferralUsage"] },
		// Don't cache registrations (critical to be real-time)
		{ model: "Registration", cacheTime: 0 },
		// Don't cache sessions (security-sensitive)
		{ model: "Session", cacheTime: 0 },
		// Don't cache accounts (security-sensitive)
		{ model: "Account", cacheTime: 0 },
		// Don't cache verification tokens (security-sensitive)
		{ model: "Verification", cacheTime: 0 }
	],
	storage: redis
		? {
				type: "redis",
				options: {
					client: redis,
					invalidation: { referencesTTL: 30 },
					log: process.env.REDIS_DEBUG === "true" ? console : undefined
				}
			}
		: {
				type: "memory",
				options: {
					size: 2048,
					invalidation: true,
					log: process.env.REDIS_DEBUG === "true" ? console : undefined
				}
			},
	cacheTime: 5,
	excludeMethods: [],
	onHit: key => {
		if (process.env.REDIS_DEBUG === "true") {
			console.log("Cache hit:", key);
		}
	},
	onMiss: key => {
		if (process.env.REDIS_DEBUG === "true") {
			console.log("Cache miss:", key);
		}
	},
	onError: key => {
		console.error("Cache error:", key);
	}
});

prisma.$use(cacheMiddleware);

export default prisma;
