import prisma from "#config/database";
import type { Prisma } from "#prisma/generated/prisma/client";

/**
 * Where-clause for an event referenced in a public URL: its id, its slug, or the last 6 characters of its id.
 * An exact id/slug match wins, so a 6-character slug can't resolve to another event whose id happens to end with it.
 */
export const eventRefWhere = async (ref: string): Promise<Prisma.EventWhereInput> => {
	const exact = await prisma.event.findFirst({ where: { OR: [{ id: ref }, { slug: ref }], isActive: true }, select: { id: true } });
	if (exact) return { id: exact.id };
	return ref.length === 6 ? { id: { endsWith: ref } } : { id: ref };
};
