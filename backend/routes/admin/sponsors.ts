/**
 * Admin routes for sponsor (logo ad) management
 */

import prisma from "#config/database";
import { Prisma } from "#prisma/generated/prisma/client";
import { tracer } from "#lib/tracing";
import { requireEventAccess, requireEventAccessViaSponsorId } from "#middleware/auth";
import { adminSponsorSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { notFoundResponse, serverErrorResponse, successResponse, validationErrorResponse } from "#utils/response";
import { emptySponsorStats, parseSponsorRow } from "#utils/sponsors";
import { SpanStatusCode } from "@opentelemetry/api";
import { SponsorPlacementSchema, type SponsorStats } from "@sitcontix/types";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "admin/sponsors" });

const DEFAULT_PLACEMENTS = ["after_registration"];

const hasText = (value: Record<string, string> | null | undefined) => Boolean(value && Object.values(value).some(text => text.trim()));

const adminSponsorsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get("/events/:eventId/sponsors", { preHandler: requireEventAccess, schema: adminSponsorSchemas.listSponsors }, async (request, reply) => {
		const { eventId } = request.params;
		const span = tracer.startSpan("route.admin.sponsors.list", { attributes: { "event.id": eventId } });

		try {
			const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
			if (!event) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}

			const [sponsors, totals] = await Promise.all([
				prisma.sponsor.findMany({ where: { eventId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
				prisma.sponsorStat.groupBy({
					by: ["sponsorId", "placement"],
					where: { sponsor: { eventId } },
					_sum: { impressions: true, clicks: true, linkClicks: true }
				})
			]);

			const statsBySponsor = new Map<string, { total: SponsorStats; byPlacement: Record<string, SponsorStats> }>();
			for (const row of totals) {
				const entry = statsBySponsor.get(row.sponsorId) ?? { total: emptySponsorStats(), byPlacement: {} };
				const stats: SponsorStats = { impressions: row._sum.impressions ?? 0, clicks: row._sum.clicks ?? 0, linkClicks: row._sum.linkClicks ?? 0 };
				entry.byPlacement[row.placement] = stats;
				entry.total.impressions += stats.impressions;
				entry.total.clicks += stats.clicks;
				entry.total.linkClicks += stats.linkClicks;
				statsBySponsor.set(row.sponsorId, entry);
			}

			const data = sponsors.map(sponsor => ({
				...parseSponsorRow(sponsor),
				stats: statsBySponsor.get(sponsor.id)?.total ?? emptySponsorStats(),
				statsByPlacement: statsBySponsor.get(sponsor.id)?.byPlacement ?? {}
			}));

			span.setAttribute("sponsors.count", data.length);
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(data));
		} catch (error) {
			componentLogger.error({ error }, "List sponsors error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to list sponsors" });
			const { response, statusCode } = serverErrorResponse("取得贊助商列表失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().get("/events/:eventId/sponsors/stats/daily", { preHandler: requireEventAccess, schema: adminSponsorSchemas.getDailyStats }, async (request, reply) => {
		const { eventId } = request.params;
		const span = tracer.startSpan("route.admin.sponsors.daily_stats", { attributes: { "event.id": eventId } });

		try {
			const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
			if (!event) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}

			const rows = await prisma.sponsorStat.findMany({
				where: { sponsor: { eventId } },
				orderBy: [{ date: "asc" }, { sponsorId: "asc" }, { placement: "asc" }]
			});

			const data = rows.flatMap(row => {
				const placement = SponsorPlacementSchema.safeParse(row.placement);
				// Rows for placements that no longer exist are dropped rather than failing the whole report.
				if (!placement.success) return [];
				return [
					{
						sponsorId: row.sponsorId,
						date: row.date.toISOString().slice(0, 10),
						placement: placement.data,
						impressions: row.impressions,
						clicks: row.clicks,
						linkClicks: row.linkClicks
					}
				];
			});

			span.setAttribute("sponsors.daily_stats.count", data.length);
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(data));
		} catch (error) {
			componentLogger.error({ error }, "Get sponsor daily stats error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get sponsor daily stats" });
			const { response, statusCode } = serverErrorResponse("取得每日曝光數據失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().post("/events/:eventId/sponsors", { preHandler: requireEventAccess, schema: adminSponsorSchemas.createSponsor }, async (request, reply) => {
		const { eventId } = request.params;
		const { name, description, logoUrl, logoDarkUrl, websiteUrl, placements, isActive } = request.body;
		const span = tracer.startSpan("route.admin.sponsors.create", { attributes: { "event.id": eventId } });

		try {
			if (!hasText(name)) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = validationErrorResponse("請輸入贊助商名稱");
				return reply.code(statusCode).send(response);
			}

			const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
			if (!event) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("活動不存在");
				return reply.code(statusCode).send(response);
			}

			const last = await prisma.sponsor.findFirst({ where: { eventId }, orderBy: { order: "desc" }, select: { order: true } });

			const sponsor = await prisma.sponsor.create({
				data: {
					eventId,
					order: (last?.order ?? -1) + 1,
					name,
					description: hasText(description) ? description : undefined,
					logoUrl,
					logoDarkUrl: logoDarkUrl ?? null,
					websiteUrl: websiteUrl ?? null,
					placements: placements ? [...new Set(placements)] : DEFAULT_PLACEMENTS,
					isActive: isActive ?? true
				}
			});

			span.setAttribute("sponsor.id", sponsor.id);
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.code(201).send(successResponse(parseSponsorRow(sponsor), "贊助商新增成功"));
		} catch (error) {
			componentLogger.error({ error }, "Create sponsor error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to create sponsor" });
			const { response, statusCode } = serverErrorResponse("新增贊助商失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	// Registered before the `:id` routes so `reorder` is never read as a sponsor id.
	fastify.withTypeProvider<ZodTypeProvider>().put("/events/:eventId/sponsors/reorder", { preHandler: requireEventAccess, schema: adminSponsorSchemas.reorderSponsors }, async (request, reply) => {
		const { eventId } = request.params;
		const { sponsors } = request.body;
		const span = tracer.startSpan("route.admin.sponsors.reorder", { attributes: { "event.id": eventId, "sponsors.reorder.count": sponsors.length } });

		try {
			const ids = sponsors.map(sponsor => sponsor.id);
			if (new Set(ids).size !== ids.length || new Set(sponsors.map(sponsor => sponsor.order)).size !== sponsors.length) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = validationErrorResponse("贊助商或順序不能重複");
				return reply.code(statusCode).send(response);
			}

			// Every sponsor must belong to the event the caller was authorized for.
			const owned = await prisma.sponsor.count({ where: { id: { in: ids }, eventId } });
			if (owned !== ids.length) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("部分贊助商不存在");
				return reply.code(statusCode).send(response);
			}

			await prisma.$transaction(sponsors.map(sponsor => prisma.sponsor.update({ where: { id: sponsor.id }, data: { order: sponsor.order } })));

			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(null, "贊助商順序更新成功"));
		} catch (error) {
			componentLogger.error({ error }, "Reorder sponsors error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to reorder sponsors" });
			const { response, statusCode } = serverErrorResponse("重新排序贊助商失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().put("/sponsors/:id", { preHandler: requireEventAccessViaSponsorId, schema: adminSponsorSchemas.updateSponsor }, async (request, reply) => {
		const { id } = request.params;
		const { name, description, logoUrl, logoDarkUrl, websiteUrl, placements, isActive } = request.body;
		const span = tracer.startSpan("route.admin.sponsors.update", { attributes: { "sponsor.id": id } });

		try {
			if (name !== undefined && !hasText(name)) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = validationErrorResponse("請輸入贊助商名稱");
				return reply.code(statusCode).send(response);
			}

			const existing = await prisma.sponsor.findUnique({ where: { id }, select: { id: true } });
			if (!existing) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("贊助商不存在");
				return reply.code(statusCode).send(response);
			}

			const data: Prisma.SponsorUpdateInput = {};
			if (name !== undefined) data.name = name;
			// An empty description clears it.
			if (description !== undefined) data.description = hasText(description) ? description : Prisma.DbNull;
			if (logoUrl !== undefined) data.logoUrl = logoUrl;
			if (logoDarkUrl !== undefined) data.logoDarkUrl = logoDarkUrl;
			if (websiteUrl !== undefined) data.websiteUrl = websiteUrl;
			if (placements !== undefined) data.placements = [...new Set(placements)];
			if (isActive !== undefined) data.isActive = isActive;

			const sponsor = await prisma.sponsor.update({ where: { id }, data });

			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(parseSponsorRow(sponsor), "贊助商更新成功"));
		} catch (error) {
			componentLogger.error({ error }, "Update sponsor error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update sponsor" });
			const { response, statusCode } = serverErrorResponse("更新贊助商失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().delete("/sponsors/:id", { preHandler: requireEventAccessViaSponsorId, schema: adminSponsorSchemas.deleteSponsor }, async (request, reply) => {
		const { id } = request.params;
		const span = tracer.startSpan("route.admin.sponsors.delete", { attributes: { "sponsor.id": id } });

		try {
			const existing = await prisma.sponsor.findUnique({ where: { id }, select: { id: true } });
			if (!existing) {
				span.setStatus({ code: SpanStatusCode.OK });
				const { response, statusCode } = notFoundResponse("贊助商不存在");
				return reply.code(statusCode).send(response);
			}

			// Tracking rows are removed with the sponsor (cascade).
			await prisma.sponsor.delete({ where: { id } });

			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(null, "贊助商已刪除"));
		} catch (error) {
			componentLogger.error({ error }, "Delete sponsor error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to delete sponsor" });
			const { response, statusCode } = serverErrorResponse("刪除贊助商失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});
};

export default adminSponsorsRoutes;
