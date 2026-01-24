import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("tickets-backend", "1.0.0");
