/** How many degrees an arrow key turns the view of the Home demo at zoom 1. */
const STEP = 5;

const clamp = (value: number, limit: number) =>
	Math.max(-limit, Math.min(limit, value));

/**
 * The pan and the tilt of the Home demo after an arrow key, or null for
 * another key. A positive pan looks to the right and a positive tilt looks
 * up: the key turns the view the way it points.
 */
export function arrowTurn(
	view: { pan: number; tilt: number; zoom: number },
	key: string,
): { pan: number; tilt: number } | null {
	const step = STEP / view.zoom;
	switch (key) {
		case "ArrowLeft":
			return { pan: clamp(view.pan - step, 180), tilt: view.tilt };
		case "ArrowRight":
			return { pan: clamp(view.pan + step, 180), tilt: view.tilt };
		case "ArrowUp":
			return { pan: view.pan, tilt: clamp(view.tilt + step, 90) };
		case "ArrowDown":
			return { pan: view.pan, tilt: clamp(view.tilt - step, 90) };
		default:
			return null;
	}
}
