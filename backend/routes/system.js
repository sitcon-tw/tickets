export default async function systemRoutes(fastify) {
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
}
