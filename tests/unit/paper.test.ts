import { expect, it } from "vitest";
import { paperFor } from "../../src/lib/paper";

it("is deterministic and cycles", () => {
	expect(paperFor(0)).toEqual(paperFor(0));
	expect(paperFor(0).tone).not.toBe(paperFor(1).tone);
	expect(paperFor(0).tilt).not.toBe(paperFor(1).tilt);
});
it("never repeats a tone on neighbours", () => {
	for (let i = 0; i < 24; i++)
		expect(paperFor(i).tone).not.toBe(paperFor(i + 1).tone);
});
it("never repeats a tilt on neighbours", () => {
	for (let i = 0; i < 24; i++)
		expect(paperFor(i).tilt).not.toBe(paperFor(i + 1).tilt);
});
