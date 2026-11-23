import { expect, test } from "vitest";
import { sampleBilinear } from "../../src/demos/fisheye-inverse/resample";

// 3x2, one channel: each pixel holds 10 * x + 100 * y
const image = {
	data: Uint8Array.from([0, 10, 20, 100, 110, 120]),
	width: 3,
	height: 2,
	channels: 1,
};

test("a pixel centre returns that pixel", () =>
	expect(sampleBilinear(image, 2, 1)).toEqual([120]));
test("a point between pixels is blended", () => {
	expect(sampleBilinear(image, 0.5, 0)[0]).toBeCloseTo(5, 6);
	expect(sampleBilinear(image, 1.5, 0.5)[0]).toBeCloseTo(65, 6);
});
test("neighbours past the edge are clamped", () => {
	// Half a pixel past the last column and the last row: the missing
	// neighbour is the edge pixel again, not the next row or nothing.
	expect(sampleBilinear(image, 2.5, 1)[0]).toBeCloseTo(120, 6);
	expect(sampleBilinear(image, 2.5, 0)[0]).toBeCloseTo(20, 6);
	expect(sampleBilinear(image, 2, 1.5)[0]).toBeCloseTo(120, 6);
	expect(sampleBilinear(image, -0.5, 1)[0]).toBeCloseTo(100, 6);
	expect(sampleBilinear(image, 1, -0.5)[0]).toBeCloseTo(10, 6);
});
test("every channel is sampled from its own values", () => {
	// 2x2, three channels: channel c of pixel p holds 10 * p + c
	const colour = {
		data: Uint8Array.from([0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32]),
		width: 2,
		height: 2,
		channels: 3,
	};
	expect(sampleBilinear(colour, 1, 1)).toEqual([30, 31, 32]);
	const middle = sampleBilinear(colour, 0.5, 0.5);
	expect(middle).toHaveLength(3);
	expect(middle[0]).toBeCloseTo(15, 6);
	expect(middle[1]).toBeCloseTo(16, 6);
	expect(middle[2]).toBeCloseTo(17, 6);
});
