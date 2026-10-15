/**
 * Helpers for recognising Prisma errors without trusting their (loosely typed) `meta`
 */

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const stringList = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/** Whether `error` is a Prisma known request error with the given code (e.g. "P2034" for a transaction write conflict) */
export const isPrismaErrorCode = (error: unknown, code: string): boolean => isRecord(error) && error.code === code;

/** Split a constraint name such as `registration_email_eventId_key` into its parts so a column name can be looked up in it */
const constraintNameParts = (value: unknown): string[] => (typeof value === "string" ? value.split("_") : []);

/**
 * Columns reported by a unique constraint violation (P2002), or undefined when `error` is not one.
 *
 * The query engine used to put the columns in `meta.target` (an array, or the constraint name as a string).
 * With a driver adapter (Prisma 7 + @prisma/adapter-pg) they are in `meta.driverAdapterError.cause.constraint`,
 * as `fields` when Postgres reports the key, otherwise only as the constraint name in `index`.
 * Constraint names contribute every `_`-separated part, so matching a column name works for both.
 */
export const uniqueConstraintFields = (error: unknown): string[] | undefined => {
	if (!isRecord(error) || !isPrismaErrorCode(error, "P2002")) return undefined;

	const meta = isRecord(error.meta) ? error.meta : {};
	const fields = [...stringList(meta.target), ...constraintNameParts(meta.target)];

	const adapterError = meta.driverAdapterError;
	const cause = isRecord(adapterError) ? adapterError.cause : undefined;
	const constraint = isRecord(cause) ? cause.constraint : undefined;
	if (isRecord(constraint)) {
		fields.push(...stringList(constraint.fields), ...constraintNameParts(constraint.index));
	}

	return fields;
};

/** Whether `error` is a unique constraint violation (P2002), optionally only one involving column `field` */
export const isUniqueConstraintError = (error: unknown, field?: string): boolean => {
	const fields = uniqueConstraintFields(error);
	if (!fields) return false;
	return field === undefined || fields.includes(field);
};
