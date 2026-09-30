import { describe, expect, it } from "vitest";
import { getVisibleFieldIds, isEmptyAnswer, normalizeFilter, pruneFormData, validateFormData, type FormLogicField } from "../src/formLogic";

const now = new Date("2026-06-01T12:00:00Z");

function field(id: string, overrides: Partial<FormLogicField> = {}): FormLogicField {
	return { id, type: "text", required: false, ...overrides };
}

function filter(action: "display" | "hide", conditions: unknown[], operator: "and" | "or" = "and") {
	return { enabled: true, action, operator, conditions };
}

const ctx = (formData: Record<string, unknown> = {}, ticketId = "t1", at = now) => ({ ticketId, formData, now: at });

describe("isEmptyAnswer", () => {
	it.each([undefined, null, "", "   ", [], false])("treats %j as empty", value => {
		expect(isEmptyAnswer(value)).toBe(true);
	});
	it.each(["a", 0, true, ["a"]])("treats %j as filled", value => {
		expect(isEmptyAnswer(value)).toBe(false);
	});
});

describe("normalizeFilter", () => {
	it("drops invalid and disabled filters", () => {
		expect(normalizeFilter({ enabled: true, action: "display", conditions: [{ type: "bogus" }] })).toBeNull();
		expect(normalizeFilter({ enabled: false, action: "display", operator: "and", conditions: [] })).toBeNull();
		expect(normalizeFilter(null)).toBeNull();
	});
});

describe("getVisibleFieldIds", () => {
	it("filters on the selected ticket", () => {
		const fields = [field("a", { filters: filter("display", [{ type: "ticket", ticketId: "t2" }]) }), field("b")];
		expect([...getVisibleFieldIds(fields, ctx({}, "t1"))]).toEqual(["b"]);
		expect([...getVisibleFieldIds(fields, ctx({}, "t2"))]).toEqual(["a", "b"]);
	});

	it("honours the hide action", () => {
		const fields = [field("a"), field("b", { filters: filter("hide", [{ type: "field", fieldId: "a", operator: "filled" }]) })];
		expect(getVisibleFieldIds(fields, ctx({ a: "x" })).has("b")).toBe(false);
		expect(getVisibleFieldIds(fields, ctx({ a: "" })).has("b")).toBe(true);
	});

	it("treats false as not filled", () => {
		const fields = [field("a", { type: "checkbox" }), field("b", { filters: filter("display", [{ type: "field", fieldId: "a", operator: "filled" }]) })];
		expect(getVisibleFieldIds(fields, ctx({ a: false })).has("b")).toBe(false);
		expect(getVisibleFieldIds(fields, ctx({ a: true })).has("b")).toBe(true);
	});

	it("ignores the answer of a hidden field in chained conditions", () => {
		const fields = [
			field("a"),
			field("b", { filters: filter("display", [{ type: "field", fieldId: "a", operator: "equals", value: "yes" }]) }),
			field("c", { filters: filter("display", [{ type: "field", fieldId: "b", operator: "filled" }]) })
		];
		// "b" still holds a stale answer, but it is hidden because a !== "yes".
		const visible = getVisibleFieldIds(fields, ctx({ a: "no", b: "stale" }));
		expect([...visible]).toEqual(["a"]);
		expect([...getVisibleFieldIds(fields, ctx({ a: "yes", b: "x" }))]).toEqual(["a", "b", "c"]);
	});

	it("does not hang on cyclic conditions and hides the cycle", () => {
		const fields = [
			field("a", { filters: filter("display", [{ type: "field", fieldId: "b", operator: "notFilled" }]) }),
			field("b", { filters: filter("display", [{ type: "field", fieldId: "a", operator: "notFilled" }]) })
		];
		expect(() => getVisibleFieldIds(fields, ctx())).not.toThrow();
	});

	it("keeps a field visible when the referenced field no longer exists", () => {
		const fields = [field("a", { filters: filter("display", [{ type: "field", fieldId: "gone", operator: "equals", value: "x" }]) })];
		expect(getVisibleFieldIds(fields, ctx()).has("a")).toBe(true);
	});

	it("compares time windows as real instants, inclusive at both ends", () => {
		const start = "2026-06-01T12:00:00Z";
		const end = "2026-06-01T13:00:00Z";
		const fields = [field("a", { filters: filter("display", [{ type: "time", startTime: start, endTime: end }]) })];
		expect(getVisibleFieldIds(fields, ctx({}, "t1", new Date("2026-06-01T11:59:59.999Z"))).has("a")).toBe(false);
		expect(getVisibleFieldIds(fields, ctx({}, "t1", new Date(start))).has("a")).toBe(true);
		expect(getVisibleFieldIds(fields, ctx({}, "t1", new Date(end))).has("a")).toBe(true);
		expect(getVisibleFieldIds(fields, ctx({}, "t1", new Date("2026-06-01T13:00:00.001Z"))).has("a")).toBe(false);
	});

	it("supports the or operator", () => {
		const fields = [
			field("a", {
				filters: filter(
					"display",
					[
						{ type: "ticket", ticketId: "x" },
						{ type: "ticket", ticketId: "t1" }
					],
					"or"
				)
			})
		];
		expect(getVisibleFieldIds(fields, ctx()).has("a")).toBe(true);
	});
});

describe("pruneFormData", () => {
	it("keeps only the answers of visible fields", () => {
		expect(pruneFormData({ a: 1, b: 2, unknown: 3 }, new Set(["a", "b"]))).toEqual({ a: 1, b: 2 });
	});
});

describe("validateFormData", () => {
	const select = field("s", { type: "select", required: true, options: [{ en: "Q&A", "zh-Hant": "問答" }, { en: "Other, please" }] });
	const checkbox = field("c", { type: "checkbox", required: true, options: [{ en: "Red, dark" }, { en: "Blue" }] });

	it("requires non-blank answers", () => {
		const fields = [field("t", { required: true }), checkbox, field("agree", { type: "checkbox", required: true })];
		expect(validateFormData(fields, ctx({ t: "   ", c: [], agree: false }))).toEqual({ t: ["required"], c: ["required"], agree: ["required"] });
		expect(validateFormData(fields, ctx({ t: "x", c: ["Blue"], agree: true }))).toEqual({});
	});

	it("skips hidden fields, even required ones", () => {
		const fields = [field("t", { required: true, filters: filter("display", [{ type: "ticket", ticketId: "other" }]) })];
		expect(validateFormData(fields, ctx())).toEqual({});
	});

	it("accepts any locale of a select option but rejects unknown values", () => {
		expect(validateFormData([select], ctx({ s: "問答" }))).toEqual({});
		expect(validateFormData([select], ctx({ s: "nope" }))).toEqual({ s: ["invalid_option"] });
		expect(validateFormData([select], ctx({ s: ["Q&A"] }))).toEqual({ s: ["invalid_type"] });
	});

	it("handles checkbox options that contain commas", () => {
		expect(validateFormData([checkbox], ctx({ c: ["Red, dark", "Blue"] }))).toEqual({});
		expect(validateFormData([checkbox], ctx({ c: ["Red", "dark"] }))).toEqual({ c: ["invalid_option"] });
		expect(validateFormData([checkbox], ctx({ c: "Blue" }))).toEqual({ c: ["invalid_type"] });
	});

	it("requires a boolean for an option-less checkbox", () => {
		const consent = field("k", { type: "checkbox" });
		expect(validateFormData([consent], ctx({ k: "true" }))).toEqual({ k: ["invalid_type"] });
		expect(validateFormData([consent], ctx({ k: true }))).toEqual({});
	});

	it("validates text against the unanchored pattern and ignores a broken pattern", () => {
		expect(validateFormData([field("t", { validater: "\\d{3}" })], ctx({ t: "ab123cd" }))).toEqual({});
		expect(validateFormData([field("t", { validater: "^\\d{3}$" })], ctx({ t: "ab123cd" }))).toEqual({ t: ["pattern"] });
		expect(validateFormData([field("t", { validater: "(" })], ctx({ t: "x" }))).toEqual({});
		expect(validateFormData([field("t", { validater: "\\d" })], ctx({ t: "   " }))).toEqual({ t: ["pattern"] });
		expect(validateFormData([field("t", { validater: "\\d" })], ctx({ t: "" }))).toEqual({});
	});

	it("allows free text for a radio with enableOther, and checks its type", () => {
		const radio = field("r", { type: "radio", options: [{ en: "A" }], enableOther: true });
		expect(validateFormData([radio], ctx({ r: "something else" }))).toEqual({});
		expect(validateFormData([radio], ctx({ r: ["x"] }))).toEqual({ r: ["invalid_type"] });
		expect(validateFormData([{ ...radio, validater: "(" }], ctx({ r: "custom" }))).toEqual({ r: ["invalid_config"] });
		expect(validateFormData([{ ...radio, enableOther: false }], ctx({ r: "custom" }))).toEqual({ r: ["invalid_option"] });
	});

	it("does not reject an unchanged stored answer whose option was removed, but still rejects a changed one", () => {
		expect(validateFormData([select], ctx({ s: "Old option" }), { s: "Old option" })).toEqual({});
		expect(validateFormData([select], ctx({ s: "Other old" }), { s: "Old option" })).toEqual({ s: ["invalid_option"] });
		expect(validateFormData([checkbox], ctx({ c: ["Gone", "Blue"] }), { c: ["Gone"] })).toEqual({});
		// Grandfathering never excuses a missing required answer.
		expect(validateFormData([select], ctx({ s: "" }), { s: "Old option" })).toEqual({ s: ["required"] });
	});
});
