import type { Prisma } from "#prisma/generated/prisma";
import type { Span } from "@opentelemetry/api";
import { APIError } from "better-auth/api";

export const MAGIC_LINK_EXPIRY_SECONDS = 15 * 60;
export const MAGIC_LINK_SEND_WINDOW_MS = 15 * 60 * 1000;

// Call inside the same serializable transaction that records the send.
// Unopened emails are delivery attempts, not failed authentication attempts.
export async function checkMagicLinkSendQuota(tx: Pick<Prisma.TransactionClient, "magicLinkAttempt">, email: string, span?: Span, now = Date.now()) {
	const sendsInWindow = await tx.magicLinkAttempt.count({
		where: {
			email,
			createdAt: { gt: new Date(now - MAGIC_LINK_SEND_WINDOW_MS) }
		}
	});

	if (sendsInWindow >= 5) {
		span?.addEvent("auth.rate_limit.throttled", {
			reason: "email_send_window_limit",
			count: sendsInWindow
		});
		throw new APIError("TOO_MANY_REQUESTS", {
			message: "登入信發送次數已達上限（15 分鐘內 5 次），請稍後再試"
		});
	}
}
