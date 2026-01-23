import { context, SpanStatusCode, trace, type Span } from "@opentelemetry/api";

const tracer = trace.getTracer("tickets-backend", "1.0.0");

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
export async function withSpan<T>(spanName: string, fn: (span: Span) => Promise<T>, attributes: SpanAttributes = {}): Promise<T> {
	return tracer.startActiveSpan(spanName, async (span: Span) => {
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
}

/**
 * Create a manual span (for more complex scenarios)
 * @param _spanName - The name of the span
 * @param attributes - Attributes for the span
 * @returns The created span
 */
export function createSpan(_spanName: string, attributes: SpanAttributes = {}): Span {
	const span = tracer.startSpan(_spanName);
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
