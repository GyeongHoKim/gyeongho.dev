import { describe, expect, it } from "vitest";
import { createEgg } from "../../src/scripts/fisheye-egg";

describe("fisheye egg", () => {
	it("activates on the fifth click and toggles off on the next", () => {
		const egg = createEgg();
		expect([egg.click(), egg.click(), egg.click(), egg.click()]).toEqual([
			false,
			false,
			false,
			false,
		]);
		expect(egg.click()).toBe(true);
		expect(egg.click()).toBe(false);
	});
	it("needs five more clicks after turning off", () => {
		const egg = createEgg();
		for (let i = 0; i < 6; i++) egg.click();
		expect([egg.click(), egg.click(), egg.click(), egg.click()]).toEqual([
			false,
			false,
			false,
			false,
		]);
		expect(egg.click()).toBe(true);
	});
	it("escape turns it off and is a no-op when inactive", () => {
		const egg = createEgg();
		expect(egg.escape()).toBe(false);
		for (let i = 0; i < 5; i++) egg.click();
		expect(egg.escape()).toBe(false);
		expect(egg.active).toBe(false);
	});
});
