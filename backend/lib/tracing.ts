import { logger } from "#utils/logger.ts";
import { context, SpanStatusCode, trace, type Span, type Tracer } from "@opentelemetry/api";

const tracingLogger = logger.child({ component: "tracing" });

const isOtelEnabled = process.env.OTEL_ENABLED === "true";

interface NoopSpan {
	setAttribute: () => void;
	setStatus: () => void;
	recordException: () => void;
	end: () => void;
	addEvent: () => void;
}

interface NoopTracer {
	startActiveSpan: <T>(_name: string, fn: (span: NoopSpan) => T) => T;
	startSpan: (_name?: string) => NoopSpan;
}

let tracer: Tracer | NoopTracer;

if (isOtelEnabled) {
	const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");
	const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
	const { NodeSDK } = await import("@opentelemetry/sdk-node");

	const traceExporter = new OTLPTraceExporter({
		url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://tempo:4318/v1/traces"
	});

	const sdk = new NodeSDK({
		traceExporter,
		serviceName: "tickets-backend",
		instrumentations: [
			getNodeAutoInstrumentations({
				"@opentelemetry/instrumentation-http": {
					ignoreIncomingRequestHook: request => {
						const url = request.url || "";
						return url === "/health" || url === "/metrics";
					}
				},
				"@opentelemetry/instrumentation-fastify": {
					requestHook: (span, info) => {
						span.setAttribute("http.route", info.request.routeOptions?.url || "unknown");
					}
				}
			})
		]
	});

	sdk.start();
	tracingLogger.info("✅ OpenTelemetry tracing initialized");

	tracer = trace.getTracer("tickets-backend", "1.0.0");
} else {
	tracingLogger.info("⚡ OpenTelemetry disabled (set OTEL_ENABLED=true to enable)");
	tracer = {
		startActiveSpan: <T>(_name: string, fn: (span: NoopSpan) => T): T => fn({ setAttribute: () => {}, setStatus: () => {}, recordException: () => {}, end: () => {}, addEvent: () => {} }),
		startSpan: (_name?: string): NoopSpan => ({ setAttribute: () => {}, setStatus: () => {}, recordException: () => {}, end: () => {}, addEvent: () => {} })
	};
}

/**
 * Attributes for span customization
 */
interface SpanAttributes {
	[key: string]: string | number | boolean;
}

/**
 * Wrap an async function with a span for tracing
 * @param spanName - The name of the span
 * @param fn - The async function to wrap
 * @param attributes - Additional attributes for the span
 * @returns The result of the function
 */
export async function withSpan<T>(spanName: string, fn: (span: Span | NoopSpan) => Promise<T>, attributes: SpanAttributes = {}): Promise<T> {
	if (isOtelEnabled) {
		return (tracer as Tracer).startActiveSpan(spanName, async (span: Span) => {
			try {
				Object.entries(attributes).forEach(([key, value]) => {
					span.setAttribute(key, value);
				});

				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: (error as Error).message
				});
				throw error;
			} finally {
				span.end();
			}
		});
	} else {
		return (tracer as NoopTracer).startActiveSpan(spanName, async (span: NoopSpan) => {
			return fn(span);
		});
	}
}

/**
 * Create a manual span (for more complex scenarios)
 * @param _spanName - The name of the span
 * @param attributes - Attributes for the span
 * @returns The created span
 */
export function createSpan(_spanName: string, attributes: SpanAttributes = {}): Span | NoopSpan {
	const span = isOtelEnabled ? (tracer as Tracer).startSpan(_spanName) : (tracer as NoopTracer).startSpan(_spanName);
	Object.entries(attributes).forEach(([key, value]) => {
		span.setAttribute(key, value);
	});
	return span;
}

/**
 * Get the current active span
 * @returns The current span or undefined
 */
export function getCurrentSpan(): Span | undefined {
	return trace.getSpan(context.active());
}

/**
 * Add an event to the current span
 * @param name - Event name
 * @param attributes - Event attributes
 */
export function addSpanEvent(name: string, attributes: SpanAttributes = {}): void {
	const span = getCurrentSpan();
	if (span) {
		span.addEvent(name, attributes);
	}
}

export { context, SpanStatusCode, trace, tracer };
export type { NoopSpan };
