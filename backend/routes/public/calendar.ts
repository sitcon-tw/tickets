import prisma from "#config/database";
import { getRedisClient } from "#config/redis";
import { notFoundResponse, serverErrorResponse } from "#utils/response";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import ical, { ICalCalendar } from "ical-generator";

interface CalendarParams {
	eventSlug: string;
}

/**
 * Generate iCalendar file for an event
 * Cached in Redis with 1 hour TTL
 */
const generateEventCalendar = async (eventSlug: string): Promise<string> => {
	const redis = getRedisClient();
	const cacheKey = `calendar:${eventSlug}`;

	// Try to get from Redis cache
	if (redis) {
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				console.log(`Calendar cache hit for event: ${eventSlug}`);
				return cached;
			}
		} catch (error) {
			console.error("Redis get error:", error);
		}
	}

	// Fetch event from database
	const event = await prisma.event.findFirst({
		where: {
			OR: [{ slug: eventSlug }, { id: eventSlug }, ...(eventSlug.length === 6 ? [{ id: { endsWith: eventSlug } }] : [])],
			isActive: true
		},
		select: {
			id: true,
			slug: true,
			name: true,
			description: true,
			plainDescription: true,
			locationText: true,
			startDate: true,
			endDate: true,
			ogImage: true
		}
	});

	if (!event) {
		throw new Error("Event not found");
	}

	// Get localized values
	const getLocalizedValue = (jsonField: any, locale: string = "zh-Hant"): string => {
		if (!jsonField) return "";
		if (typeof jsonField === "string") return jsonField;
		if (typeof jsonField === "object") {
			return jsonField[locale] || jsonField["zh-TW"] || jsonField["en"] || Object.values(jsonField)[0] || "";
		}
		return String(jsonField);
	};

	const eventName = getLocalizedValue(event.name);
	const eventDescription = getLocalizedValue(event.plainDescription || event.description);
	const eventLocation = getLocalizedValue(event.locationText);

	// Get frontend URL
	const frontendUrl = process.env.FRONTEND_URI || "http://localhost:3000";
	const eventUrl = `${frontendUrl}/${event.slug || event.id}`;

	// Create iCalendar
	const calendar: ICalCalendar = ical({
		name: eventName,
		description: eventDescription,
		timezone: "Asia/Taipei",
		prodId: {
			company: "SITCON",
			product: "SITCONTIX",
			language: "ZH-TW"
		},
		url: eventUrl
	});

	// Add event
	calendar.createEvent({
		start: event.startDate,
		end: event.endDate,
		summary: eventName,
		description: eventDescription,
		location: eventLocation,
		url: eventUrl,
		organizer: {
			name: "SITCON",
			email: "contact@sitcon.org"
		}
	});

	const icalString = calendar.toString();

	// Cache in Redis for 1 hour
	if (redis) {
		try {
			await redis.setex(cacheKey, 3600, icalString);
			console.log(`Calendar cached for event: ${eventSlug}`);
		} catch (error) {
			console.error("Redis set error:", error);
		}
	}

	return icalString;
};

const publicCalendarRoutes: FastifyPluginAsync = async fastify => {
	// Get iCalendar file for an event
	fastify.get<{ Params: CalendarParams }>("/events/:eventSlug/calendar.ics", async (request: FastifyRequest<{ Params: CalendarParams }>, reply: FastifyReply) => {
		try {
			const { eventSlug } = request.params;

			const icalString = await generateEventCalendar(eventSlug);

			// Set headers for calendar download
			reply.header("Content-Type", "text/calendar; charset=utf-8");
			reply.header("Content-Disposition", `attachment; filename="${eventSlug}.ics"`);
			reply.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

			return reply.send(icalString);
		} catch (error) {
			console.error("Generate calendar error:", error);
			if (error instanceof Error && error.message === "Event not found") {
				const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
				return reply.code(statusCode).send(response);
			}
			const { response, statusCode } = serverErrorResponse("生成行事曆失敗");
			return reply.code(statusCode).send(response);
		}
	});
};

export default publicCalendarRoutes;
