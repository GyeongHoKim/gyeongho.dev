import { expect, test } from "vitest";
import { arrowTurn } from "../../src/scripts/fisheye-keys";

const view = { pan: 10, tilt: 20, zoom: 1 };

// In the Home demo a positive tilt looks up and a positive pan to the right.
test("an arrow key turns the view the way it points", () => {
	expect(arrowTurn(view, "ArrowUp")).toEqual({ pan: 10, tilt: 25 });
	expect(arrowTurn(view, "ArrowDown")).toEqual({ pan: 10, tilt: 15 });
	expect(arrowTurn(view, "ArrowRight")).toEqual({ pan: 15, tilt: 20 });
	expect(arrowTurn(view, "ArrowLeft")).toEqual({ pan: 5, tilt: 20 });
});

test("a zoomed view turns by a smaller step", () => {
	expect(arrowTurn({ ...view, zoom: 2 }, "ArrowUp")).toEqual({
		pan: 10,
		tilt: 22.5,
	});
	expect(arrowTurn({ ...view, zoom: 4 }, "ArrowLeft")).toEqual({
		pan: 8.75,
		tilt: 20,
	});
});

test("the view stops at its limits", () => {
	const top = { pan: 178, tilt: 88, zoom: 1 };
	expect(arrowTurn(top, "ArrowUp")).toEqual({ pan: 178, tilt: 90 });
	expect(arrowTurn(top, "ArrowRight")).toEqual({ pan: 180, tilt: 88 });
	const bottom = { pan: -178, tilt: -88, zoom: 1 };
	expect(arrowTurn(bottom, "ArrowDown")).toEqual({ pan: -178, tilt: -90 });
	expect(arrowTurn(bottom, "ArrowLeft")).toEqual({ pan: -180, tilt: -88 });
});

test("another key does not turn the view", () => {
	for (const key of ["+", "-", "=", "Enter", "Tab", "a"])
		expect(arrowTurn(view, key)).toBeNull();
});
