import type { FastifyPluginAsync } from "fastify";

const systemRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get(
		"/health",
		{
			schema: {
				tags: ["system"]
			}
		},
		async (request, reply) => {
			return { status: "ok" };
		}
	);
};

export default systemRoutes;
