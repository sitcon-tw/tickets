import prisma from "#config/database";
import { getRedisClient } from "#config/redis";
import { tracer } from "#lib/tracing";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse } from "#utils/response";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import ical, { ICalCalendar } from "ical-generator";

const componentLogger = logger.child({ component: "public/calendar" });

interface CalendarParams {
	eventSlug: string;
}

/**
 * Generate iCalendar file for an event
 * Cached in Redis with 1 hour TTL
 */
const generateEventCalendar = async (eventSlug: string, span?: any): Promise<string> => {
	const redis = getRedisClient();
	const cacheKey = `calendar:${eventSlug}`;

	// Try to get from Redis cache
	if (redis) {
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				componentLogger.info({ eventSlug }, "Calendar cache hit for event");
				return cached;
			}
		} catch (error) {
			componentLogger.error({ error }, "Redis get error");
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

	if (span) {
		span.setAttribute("event.id", event.id);
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
			componentLogger.info({ eventSlug }, "Calendar cached for event");
		} catch (error) {
			componentLogger.error({ error }, "Redis set error");
		}
	}

	return icalString;
};

const publicCalendarRoutes: FastifyPluginAsync = async fastify => {
	// Get iCalendar file for an event
	fastify.get<{ Params: CalendarParams }>("/events/:eventSlug/calendar.ics", async (request: FastifyRequest<{ Params: CalendarParams }>, reply: FastifyReply) => {
		const span = tracer.startSpan("route.calendar.get_event", {
			attributes: {
				"event.slug": request.params.eventSlug
			}
		});

		try {
			const { eventSlug } = request.params;

			span.addEvent("calendar.generate_start");

			const icalString = await generateEventCalendar(eventSlug, span);

			span.addEvent("calendar.generate_complete");
			span.setAttribute("calendar.size", icalString.length);

			// Set headers for calendar download
			reply.header("Content-Type", "text/calendar; charset=utf-8");
			reply.header("Content-Disposition", `attachment; filename="${eventSlug}.ics"`);
			reply.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

			span.setStatus({ code: SpanStatusCode.OK });

			return reply.send(icalString);
		} catch (error) {
			componentLogger.error({ error }, "Generate calendar error");
			span.recordException(error as Error);

			if (error instanceof Error && error.message === "Event not found") {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Event not found"
				});
				const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
				return reply.code(statusCode).send(response);
			}

			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: "Failed to generate calendar"
			});
			const { response, statusCode } = serverErrorResponse("生成行事曆失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});
};

export default publicCalendarRoutes;
