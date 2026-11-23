import { expect, test } from "vitest";
import {
	CAM1,
	clampView,
	dragView,
	footprint,
	footprintPath,
	INITIAL_VIEW,
	scaleLens,
	sourcePoint,
	squareOutput,
	turnView,
} from "../../src/demos/fisheye-inverse/mapping";

const out = squareOutput(CAM1, 720);
const at = (
	view: { pan: number; tilt: number; zoom: number },
	x: number,
	y: number,
) => sourcePoint(CAM1, view, out, x, y);
const close = (p: { x: number; y: number } | null, x: number, y: number) => {
	expect(p).not.toBeNull();
	expect(p?.x).toBeCloseTo(x, 2);
	expect(p?.y).toBeCloseTo(y, 2);
};

test("the output focal length follows the lens", () => {
	expect(out.fx).toBeCloseTo((991 * 720) / 3264, 6);
	expect(out).toMatchObject({ width: 720, height: 720, cx: 360, cy: 360 });
});
test("the centre of the view reads the principal point", () =>
	close(at(INITIAL_VIEW, 360, 360), 1612, 1617));
test("corners and edges at the initial view", () => {
	close(at(INITIAL_VIEW, 0, 0), 786.382, 791.382);
	close(at(INITIAL_VIEW, 720, 720), 2437.618, 2442.618);
	close(at(INITIAL_VIEW, 540, 360), 2302.589, 1617);
});
test("pan, tilt and zoom move the point that is read", () => {
	close(at({ pan: 30, tilt: 0, zoom: 1 }, 360, 360), 2135.001, 1617);
	close(at({ pan: 0, tilt: 20, zoom: 1 }, 360, 360), 1612, 1269.704);
	close(at({ pan: 0, tilt: 0, zoom: 2 }, 0, 0), 999.944, 1004.944);
	close(at({ pan: -40, tilt: 25, zoom: 2 }, 100, 600), 432.28, 1691.416);
	close(at({ pan: 75, tilt: 75, zoom: 1 }, 360, 360), 1979.969, 195.278);
});
test("a ray behind the lens or outside the photo reads nothing", () => {
	expect(at({ pan: 120, tilt: 0, zoom: 1 }, 360, 360)).toBeNull();
	expect(at({ pan: 60, tilt: 0, zoom: 1 }, 720, 360)).toBeNull();
});
test("a point outside the photo reads nothing", () => {
	// The demo lens never leaves its photo at a valid angle, so the photo is cropped.
	// (540, 360) reads (2302.589, 1617) and (360, 540) reads (1612, 2307.589).
	const reads = (crop: Partial<typeof CAM1>, x: number, y: number) =>
		sourcePoint({ ...CAM1, ...crop }, INITIAL_VIEW, out, x, y);
	expect(reads({ width: 2304 }, 540, 360)).not.toBeNull();
	expect(reads({ width: 2303 }, 540, 360)).toBeNull();
	expect(reads({ height: 2309 }, 360, 540)).not.toBeNull();
	expect(reads({ height: 2308 }, 360, 540)).toBeNull();
	// A principal point near the corner puts the left and the top of the view outside.
	expect(reads({ cx: 100 }, 360, 360)).not.toBeNull();
	expect(reads({ cx: 100 }, 180, 360)).toBeNull();
	expect(reads({ cy: 100 }, 360, 180)).toBeNull();
});
test("a scaled lens gives scaled points", () => {
	const lens = scaleLens(CAM1, 1024 / 3264);
	const p = sourcePoint(
		lens,
		{ pan: 30, tilt: 0, zoom: 1 },
		squareOutput(lens, 720),
		360,
		360,
	);
	expect(p?.x).toBeCloseTo((2135.001 * 1024) / 3264, 2);
	expect(lens.k1).toBe(CAM1.k1);
	// fisheye.js is given a photo of exactly this size.
	expect(lens.width).toBe(1024);
	expect(lens.height).toBe(1024);
});
test("the footprint walks the border clockwise from the top-left corner", () => {
	const points = footprint(CAM1, INITIAL_VIEW, out, 24);
	expect(points).toHaveLength(96);
	expect(points.every((p) => p !== null)).toBe(true);
	close(points[0] ?? null, 786.382, 791.382);
	// Along the top edge first, then one corner every 24 points.
	expect(points[6]).toEqual(at(INITIAL_VIEW, 180, 0));
	expect(points[24]).toEqual(at(INITIAL_VIEW, 720, 0));
	expect(points[30]).toEqual(at(INITIAL_VIEW, 720, 180));
	expect(points[48]).toEqual(at(INITIAL_VIEW, 720, 720));
	expect(points[72]).toEqual(at(INITIAL_VIEW, 0, 720));
	expect(points[95]).toEqual(at(INITIAL_VIEW, 0, 30));
	expect(
		footprint(CAM1, { pan: 60, tilt: 0, zoom: 1 }, out, 24).filter(
			(p) => p === null,
		),
	).toHaveLength(39);
});
test("the footprint path closes only when every point is valid", () => {
	const a = { x: 0, y: 0 },
		b = { x: 1, y: 0 },
		c = { x: 1, y: 1 },
		d = { x: 0, y: 1 };
	expect(footprintPath([a, b, c, d])).toBe("M0 0L1 0L1 1L0 1Z");
	expect(footprintPath([a, b, null, c, d])).toBe("M1 1L0 1L0 0L1 0");
	expect(footprintPath([a, null, b, null, c])).toBe("M1 0M1 1L0 0");
	expect(footprintPath([null, null])).toBe("");
});
test("the footprint path keeps one decimal", () => {
	expect(
		footprintPath([
			{ x: 1.26, y: 2.34 },
			{ x: 786.382, y: 791.349 },
		]),
	).toBe("M1.3 2.3L786.4 791.3Z");
});
test("views are clamped and dragging follows the grab", () => {
	expect(clampView({ pan: 200, tilt: -90, zoom: 9 })).toEqual({
		pan: 75,
		tilt: -75,
		zoom: 4,
	});
	expect(clampView({ pan: -200, tilt: 90, zoom: 0.2 })).toEqual({
		pan: -75,
		tilt: 75,
		zoom: 1,
	});
	expect(dragView({ pan: 0, tilt: 0, zoom: 2 }, 40, -20)).toEqual({
		pan: -5,
		tilt: -2.5,
		zoom: 2,
	});
});
test("a drag stops at the limits of the view", () => {
	expect(dragView({ pan: 70, tilt: 70, zoom: 1 }, -100, 100)).toEqual({
		pan: 75,
		tilt: 75,
		zoom: 1,
	});
	expect(dragView({ pan: -70, tilt: -70, zoom: 1 }, 100, -100)).toEqual({
		pan: -75,
		tilt: -75,
		zoom: 1,
	});
});
test("a step on the screen turns the view the way it points", () => {
	const view = { pan: 0, tilt: 0, zoom: 2 };
	// Up on the screen is the smaller y: the tilt goes up, and the centre of
	// the view reads what is higher on the photo.
	const up = turnView(view, [0, -1], 5);
	expect(up).toEqual({ pan: 0, tilt: 2.5, zoom: 2 });
	expect(at(up, 360, 360)?.y).toBeLessThan(at(view, 360, 360)?.y ?? 0);
	const down = turnView(view, [0, 1], 5);
	expect(down).toEqual({ pan: 0, tilt: -2.5, zoom: 2 });
	expect(at(down, 360, 360)?.y).toBeGreaterThan(at(view, 360, 360)?.y ?? 0);
	const right = turnView(view, [1, 0], 5);
	expect(right).toEqual({ pan: 2.5, tilt: 0, zoom: 2 });
	expect(at(right, 360, 360)?.x).toBeGreaterThan(at(view, 360, 360)?.x ?? 0);
	expect(turnView(view, [-1, 0], 5)).toEqual({ pan: -2.5, tilt: 0, zoom: 2 });
});
test("a step stops at the limits of the view", () => {
	expect(turnView({ pan: 73, tilt: 73, zoom: 1 }, [1, -1], 5)).toEqual({
		pan: 75,
		tilt: 75,
		zoom: 1,
	});
	expect(turnView({ pan: -73, tilt: -73, zoom: 1 }, [-1, 1], 5)).toEqual({
		pan: -75,
		tilt: -75,
		zoom: 1,
	});
});
