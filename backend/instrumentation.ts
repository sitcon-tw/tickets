import "@opentelemetry/auto-instrumentations-node/register";

import FastifyOtelInstrumentation from "@fastify/otel";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { PrismaInstrumentation } from "@prisma/instrumentation";

registerInstrumentations({
	instrumentations: [
		getNodeAutoInstrumentations({
			"@opentelemetry/instrumentation-http": {
				ignoreIncomingRequestHook: request => {
					const url = request.url || "";
					return url === "/health" || url === "/metrics";
				}
			}
		}),
		new FastifyOtelInstrumentation({ registerOnInitialization: true }),
		new PrismaInstrumentation()
	]
});
