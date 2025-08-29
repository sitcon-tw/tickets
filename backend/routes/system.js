export default async function systemRoutes(fastify) {
	fastify.get(
		"/health",
		async (request, reply) => {
			return { status: "ok" };
		}
	);
}
