import prisma from "#config/database";
import { logger } from "#utils/logger";

const componentLogger = logger.child({ component: "registration-hold" });

/**
 * How long a seat is held for a user while they fill out the registration form.
 * The hold is a `pending` registration; it is completed by submitting the form
 * and released when it expires or is cancelled.
 */
export const REGISTRATION_HOLD_MS = 15 * 60 * 1000;

const SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Cancel a pending hold and give its seat (ticket stock, invitation code usage,
 * referral usage) back. With `onlyExpired` it only releases holds whose time has
 * run out. Safe to call concurrently: only one caller can claim a given hold.
 */
export async function releaseHold(id: string, { onlyExpired }: { onlyExpired: boolean }): Promise<boolean> {
	return prisma.$transaction(async tx => {
		const claimed = await tx.registration.updateMany({
			where: { id, status: "pending", ...(onlyExpired && { holdExpiresAt: { lt: new Date() } }) },
			data: { status: "cancelled", holdExpiresAt: null }
		});
		if (claimed.count === 0) return false;

		const registration = await tx.registration.findUniqueOrThrow({
			where: { id },
			select: { ticketId: true, invitationCodeId: true }
		});

		await tx.ticket.update({ where: { id: registration.ticketId }, data: { soldCount: { decrement: 1 } } });
		if (registration.invitationCodeId) {
			await tx.invitationCode.update({ where: { id: registration.invitationCodeId }, data: { usedCount: { decrement: 1 } } });
		}
		await tx.referralUsage.deleteMany({ where: { registrationId: id } });
		return true;
	});
}

/** Release every hold whose time has run out. Returns how many seats were freed. */
export async function releaseExpiredHolds(): Promise<number> {
	const expired = await prisma.registration.findMany({
		where: { status: "pending", holdExpiresAt: { lt: new Date() } },
		select: { id: true }
	});

	let released = 0;
	for (const { id } of expired) {
		try {
			if (await releaseHold(id, { onlyExpired: true })) released++;
		} catch (error) {
			componentLogger.error({ error, registrationId: id }, "Failed to release expired registration hold");
		}
	}

	return released;
}

export function startHoldSweeper(): NodeJS.Timeout {
	const timer = setInterval(() => {
		releaseExpiredHolds().catch(error => componentLogger.error({ error }, "Registration hold sweep failed"));
	}, SWEEP_INTERVAL_MS);
	timer.unref();
	return timer;
}

export type PurchaseErrorKind = "unauthorized" | "notFound" | "conflict" | "validation";

/** A reason a user can't take a seat on a ticket; `message` is safe to show to them. */
export class PurchaseError extends Error {
	constructor(
		public kind: PurchaseErrorKind,
		message: string
	) {
		super(message);
		this.name = "PurchaseError";
	}
}

/**
 * Check that a user may take a seat on a ticket right now (event/ticket open, in stock,
 * inside the sale window, invitation code and SMS verification satisfied).
 * Throws PurchaseError when they can't. Shared by holding a seat and registering directly.
 */
export async function resolveTicketPurchase(params: { userId: string; eventId: string; ticketId: string; invitationCode?: string }) {
	const { userId, eventId, ticketId, invitationCode } = params;

	const [event, ticket] = await Promise.all([
		prisma.event.findUnique({ where: { id: eventId, isActive: true } }),
		prisma.ticket.findUnique({ where: { id: ticketId, eventId, isActive: true, hidden: false } })
	]);

	if (!event) throw new PurchaseError("notFound", "活動不存在或已關閉");
	if (!ticket) throw new PurchaseError("notFound", "票券不存在或已關閉");
	if (ticket.soldCount >= ticket.quantity) throw new PurchaseError("conflict", "票券已售完");

	const now = new Date();
	if (ticket.saleStart && now < ticket.saleStart) throw new PurchaseError("validation", "票券尚未開始販售");
	if (ticket.saleEnd && now > ticket.saleEnd) throw new PurchaseError("validation", "票券販售已結束");

	let invitationCodeId: string | null = null;
	if (ticket.requireInviteCode) {
		if (!invitationCode) throw new PurchaseError("unauthorized", "此票券需要邀請碼");

		const code = await prisma.invitationCode.findFirst({ where: { code: invitationCode, ticketId, isActive: true } });
		if (!code) throw new PurchaseError("validation", "無效的邀請碼");
		if (code.validUntil && now > code.validUntil) throw new PurchaseError("validation", "邀請碼已過期");
		if (code.validFrom && now < code.validFrom) throw new PurchaseError("validation", "邀請碼尚未生效");
		if (code.usageLimit && code.usedCount >= code.usageLimit) throw new PurchaseError("validation", "邀請碼已達使用上限");

		invitationCodeId = code.id;
	} else if (invitationCode) {
		// Not required, but use it if it is valid
		const code = await prisma.invitationCode.findFirst({ where: { code: invitationCode, ticketId, isActive: true } });
		if (code && (!code.validUntil || now <= code.validUntil) && (!code.validFrom || now >= code.validFrom) && (!code.usageLimit || code.usedCount < code.usageLimit)) {
			invitationCodeId = code.id;
		}
	}

	if (ticket.requireSmsVerification) {
		const verifiedUser = await prisma.user.findUnique({ where: { id: userId }, select: { phoneVerified: true } });
		if (!verifiedUser?.phoneVerified) throw new PurchaseError("validation", "此票券需要驗證手機號碼");
	}

	return { event, ticket, invitationCodeId };
}
