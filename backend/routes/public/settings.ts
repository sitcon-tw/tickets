import { tracer } from "#lib/tracing";
import { settingsSchemas } from "#schemas";
import { logger } from "#utils/logger";
import { serverErrorResponse, successResponse } from "#utils/response";
import { getSiteSettings } from "#utils/settings";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const componentLogger = logger.child({ component: "public/settings" });

const publicSettingsRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get("/settings", { schema: settingsSchemas.getPublicSettings }, async (_request, reply) => {
		const span = tracer.startSpan("route.public.settings.get");

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
};

export default publicSettingsRoutes;
