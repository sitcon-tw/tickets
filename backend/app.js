import cors from "@fastify/cors";
import staticPlugin from "@fastify/static";
import dotenv from "dotenv";
import Fastify from "fastify";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
	logger: true
});

// Enable CORS
await fastify.register(cors);

// Serve static files from "public"
await fastify.register(staticPlugin, {
	root: join(__dirname, "public"),
	prefix: "/" // Serve files directly from root
});

// Sample route
fastify.get("/api/hello", async (request, reply) => {
	return { message: "Hello from Fastify!" };
});

const port = process.env.PORT || 3000;

fastify.listen({ port }, (err, address) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	fastify.log.info(`Server running at ${address}`);
});
