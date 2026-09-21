/**
 * Convert an unknown value to text. Behaves like `String()` for primitives and arrays,
 * but serializes plain objects as JSON instead of "[object Object]".
 */
export const toText = (value: unknown): string => {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint" || typeof value === "symbol") return value.toString();
	if (value === null || value === undefined) return String(value);
	if (Array.isArray(value)) return value.map(item => (item === null || item === undefined ? "" : toText(item))).join(",");
	if (value instanceof Date) return value.toString();
	return JSON.stringify(value) ?? "";
};
