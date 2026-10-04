import prisma from "#config/database";
import { tracer } from "#lib/tracing";
import { publicSponsorSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse } from "#utils/response";
import { incrementSponsorStats, isBotUserAgent, parseSponsorRow, parseSponsorTitles, type SponsorCounter } from "#utils/sponsors";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "public/sponsors" });

const publicSponsorsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get("/events/:id/sponsors", { schema: publicSponsorSchemas.getSponsors }, async (request, reply) => {
		const span = tracer.startSpan("route.public.sponsors.list");

		try {
			const { id } = request.params;
			span.setAttribute("event.lookup_id", id);

			const event = await prisma.event.findFirst({
				where: {
					OR: [{ id }, { slug: id }, ...(id.length === 6 ? [{ id: { endsWith: id } }] : [])],
					isActive: true
				},
				select: { id: true, sponsorTitles: true }
			});

			if (!event) {
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Event not found" });
				const { response, statusCode } = notFoundResponse("活動不存在或已關閉");
				return reply.code(statusCode).send(response);
			}

			const sponsors = await prisma.sponsor.findMany({
				where: { eventId: event.id, isActive: true },
				orderBy: [{ order: "asc" }, { createdAt: "asc" }],
				select: { id: true, name: true, description: true, logoUrl: true, logoDarkUrl: true, logoBgColor: true, logoDarkBgColor: true, websiteUrl: true, placements: true }
			});

			span.setAttribute("sponsors.count", sponsors.length);
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse({ sponsors: sponsors.map(parseSponsorRow), sectionTitles: parseSponsorTitles(event.sponsorTitles) }));
		} catch (error) {
			componentLogger.error({ error }, "Get public sponsors error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get sponsors" });
			const { response, statusCode } = serverErrorResponse("取得贊助商失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().post(
		"/sponsors/track",
		{
			schema: publicSponsorSchemas.track,
			// Cheap and unauthenticated, so keep a tight per-IP cap to limit counter stuffing.
			config: { rateLimit: { max: 120, timeWindow: "1 minute" } }
		},
		async (request, reply) => {
			const span = tracer.startSpan("route.public.sponsors.track");

			try {
				if (isBotUserAgent(request.headers["user-agent"])) {
					span.addEvent("sponsors.track.bot_ignored");
					span.setStatus({ code: SpanStatusCode.OK });
					return reply.send(successResponse(null));
				}

				const requested = [...new Set(request.body.events.map(event => event.sponsorId))];
				const active = await prisma.sponsor.findMany({
					where: { id: { in: requested }, isActive: true, event: { isActive: true } },
					select: { id: true, placements: true }
				});
				const placementsBySponsor = new Map(active.map(sponsor => [sponsor.id, sponsor.placements]));

				const counters = new Map<string, SponsorCounter>();
				for (const { sponsorId, placement, type } of request.body.events) {
					// Ignore unknown / hidden sponsors and placements the sponsor is not configured for.
					if (!placementsBySponsor.get(sponsorId)?.includes(placement)) continue;

					const key = `${sponsorId}:${placement}`;
					const counter = counters.get(key) ?? { sponsorId, placement, impressions: 0, clicks: 0, linkClicks: 0 };
					if (type === "impression") counter.impressions++;
					else if (type === "click") counter.clicks++;
					else counter.linkClicks++;
					counters.set(key, counter);
				}

				await incrementSponsorStats([...counters.values()]);

				span.setAttribute("sponsors.track.counters", counters.size);
				span.setStatus({ code: SpanStatusCode.OK });
				return reply.send(successResponse(null));
			} catch (error) {
				componentLogger.error({ error }, "Track sponsors error");
				span.recordException(error as Error);
				span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to track sponsors" });
				const { response, statusCode } = serverErrorResponse("回報失敗");
				return reply.code(statusCode).send(response);
			} finally {
				span.end();
			}
		}
	);
};

export default publicSponsorsRoutes;
