import { tracer } from "#lib/tracing";
import { requireAdmin } from "#middleware/auth";
import { settingsSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { serverErrorResponse, successResponse } from "#utils/response";
import { getSiteSettings, updateSiteSettings } from "#utils/settings";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "admin/settings" });

const adminSettingsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get("/settings", { preHandler: requireAdmin, schema: settingsSchemas.getSettings }, async (_request, reply) => {
		const span = tracer.startSpan("route.admin.settings.get");

		try {
			const settings = await getSiteSettings();
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(settings));
		} catch (error) {
			componentLogger.error({ error }, "Get site settings error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to get site settings" });
			const { response, statusCode } = serverErrorResponse("取得網站設定失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().put("/settings", { preHandler: requireAdmin, schema: settingsSchemas.updateSettings }, async (request, reply) => {
		const span = tracer.startSpan("route.admin.settings.update");

		try {
			const settings = await updateSiteSettings(request.body);
			span.setStatus({ code: SpanStatusCode.OK });
			return reply.send(successResponse(settings, "設定已更新"));
		} catch (error) {
			componentLogger.error({ error }, "Update site settings error");
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR, message: "Failed to update site settings" });
			const { response, statusCode } = serverErrorResponse("更新網站設定失敗");
			return reply.code(statusCode).send(response);
		} finally {
			span.end();
		}
	});
};

export default adminSettingsRoutes;
