import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import resourcesPkg from "@opentelemetry/resources";
import semanticConventionsPkg from "@opentelemetry/semantic-conventions";

// Extract named exports from CommonJS modules
const { Resource } = resourcesPkg;
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = semanticConventionsPkg;

// Configure the OTLP trace exporter to send traces to Tempo
const traceExporter = new OTLPTraceExporter({
	url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://tempo:4318/v1/traces"
});

// Configure service resource with semantic conventions
const resource = new Resource({
	[ATTR_SERVICE_NAME]: "tickets-backend",
	[ATTR_SERVICE_VERSION]: "1.0.0"
});

// Initialize the OpenTelemetry SDK
const sdk = new NodeSDK({
	resource,
	traceExporter,
	instrumentations: [
		getNodeAutoInstrumentations({
			// Custom configuration for HTTP instrumentation
			"@opentelemetry/instrumentation-http": {
				ignoreIncomingRequestHook: request => {
					// Ignore health check and metrics endpoints
					const url = request.url || "";
					return url === "/health" || url === "/metrics";
				}
			},
			// Custom configuration for Fastify instrumentation
			"@opentelemetry/instrumentation-fastify": {
				requestHook: (span, info) => {
					// Add custom attributes to HTTP spans
					span.setAttribute("http.route", info.request.routeOptions?.url || "unknown");
				}
			}
		})
	]
});

sdk.start();
console.log("✅ OpenTelemetry tracing initialized");

// Export tracer for manual instrumentation
const tracer = trace.getTracer("tickets-backend", "1.0.0");

/**
 * Wrap an async function with a span for tracing
 * @param {string} spanName - The name of the span
 * @param {Function} fn - The async function to wrap
 * @param {Object} attributes - Additional attributes for the span
 * @returns {Promise<any>} - The result of the function
 */
export async function withSpan(spanName, fn, attributes = {}) {
	return tracer.startActiveSpan(spanName, async span => {
		try {
			// Add custom attributes
			Object.entries(attributes).forEach(([key, value]) => {
				span.setAttribute(key, value);
			});

			// Execute the function
			const result = await fn(span);

			// Mark span as successful
			span.setStatus({ code: SpanStatusCode.OK });
			return result;
		} catch (error) {
			// Record the error
			span.recordException(error);
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: error.message
			});
			throw error;
		} finally {
			span.end();
		}
	});
}

/**
 * Create a manual span (for more complex scenarios)
 * @param {string} spanName - The name of the span
 * @param {Object} attributes - Attributes for the span
 * @returns {import('@opentelemetry/api').Span}
 */
export function createSpan(spanName, attributes = {}) {
	const span = tracer.startSpan(spanName);
	Object.entries(attributes).forEach(([key, value]) => {
		span.setAttribute(key, value);
	});
	return span;
}

/**
 * Get the current active span
 * @returns {import('@opentelemetry/api').Span | undefined}
 */
export function getCurrentSpan() {
	return trace.getSpan(context.active());
}

/**
 * Add an event to the current span
 * @param {string} name - Event name
 * @param {Object} attributes - Event attributes
 */
export function addSpanEvent(name, attributes = {}) {
	const span = getCurrentSpan();
	if (span) {
		span.addEvent(name, attributes);
	}
}

export { context, SpanStatusCode, trace, tracer };
