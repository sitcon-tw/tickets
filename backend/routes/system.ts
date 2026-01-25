import { tracer } from "#lib/tracing";
import { SpanStatusCode } from "@opentelemetry/api";
import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

const systemRoutes: FastifyPluginAsync = async fastify => {
	fastify.withTypeProvider<ZodTypeProvider>().get(
		"/health",
		{
			schema: {
				tags: ["system"]
			}
		},
		async (_request, _reply) => {
			const span = tracer.startSpan("route.system.health");

			try {
				span.setStatus({ code: SpanStatusCode.OK });
				return { status: "ok" };
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: "Failed to get health status"
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export default systemRoutes;
