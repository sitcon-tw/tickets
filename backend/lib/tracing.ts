import { Attributes, context, SpanStatusCode, trace, type Span } from "@opentelemetry/api";

const tracer = trace.getTracer("tickets-backend", "1.0.0");

/**
 * Wrap an async function with a span for tracing
 * @param spanName - The name of the span
 * @param fn - The async function to wrap
 * @param attributes - Additional attributes for the span
 * @returns The result of the function
 */
export async function withSpan<T>(spanName: string, fn: (span: Span) => Promise<T>, attributes: Attributes = {}): Promise<T> {
	return tracer.startActiveSpan(spanName, async (span: Span) => {
		try {
			for (const [key, value] of Object.entries(attributes)) {
				if (value != null) {
					span.setAttribute(key, value);
				}
			}

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

export { context, SpanStatusCode, trace, tracer };
