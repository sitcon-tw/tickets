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
			return { status: "ok" };
		}
	);
};

export default systemRoutes;
