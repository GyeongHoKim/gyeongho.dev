// Output pixel -> source pixel, in the same order as the fisheye.js 2.2.0 shader
// (OpenCV lens, rectilinear projection). fisheye.js does not export this calculation.

export interface Lens {
	fx: number;
	fy: number;
	cx: number;
	cy: number;
	k1: number;
	k2: number;
	k3: number;
	k4: number;
	width: number;
	height: number;
}
/** Angles are in degrees. */
export interface View {
	pan: number;
	tilt: number;
	zoom: number;
}
/** In output pixels. */
export interface Output {
	width: number;
	height: number;
	fx: number;
	fy: number;
	cx: number;
	cy: number;
}
export interface Point {
	x: number;
	y: number;
}

// Calibration from the fisheye.js example (test_cases.json), the same values as the Home demo.
export const CAM1: Lens = {
	fx: 991,
	fy: 991,
	cx: 1612,
	cy: 1617,
	k1: 0.03562009,
	k2: -0.02587979,
	k3: 0.00564249,
	k4: -0.00107043,
	width: 3264,
	height: 3264,
};

export const INITIAL_VIEW: View = { pan: 0, tilt: 0, zoom: 1 };

const MAX_ANGLE = 75;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DEGREES_PER_PIXEL = 0.25;

/** The same lens measured on a photo resized by `factor`. The distortion does not change. */
export function scaleLens(lens: Lens, factor: number): Lens {
	return {
		...lens,
		fx: lens.fx * factor,
		fy: lens.fy * factor,
		cx: lens.cx * factor,
		cy: lens.cy * factor,
		width: lens.width * factor,
		height: lens.height * factor,
	};
}

export function squareOutput(lens: Lens, size: number): Output {
	return {
		width: size,
		height: size,
		fx: (lens.fx * size) / lens.width,
		fy: (lens.fy * size) / lens.height,
		cx: size / 2,
		cy: size / 2,
	};
}

/** The source pixel that output pixel (x, y) reads, or null when it reads nothing. */
export function sourcePoint(
	lens: Lens,
	view: View,
	output: Output,
	x: number,
	y: number,
): Point | null {
	let rx = (x - output.cx) / (output.fx * view.zoom);
	let ry = (y - output.cy) / (output.fy * view.zoom);
	let rz = 1;
	const norm = Math.hypot(rx, ry, rz);
	rx /= norm;
	ry /= norm;
	rz /= norm;
	const tilt = (view.tilt * Math.PI) / 180;
	const pan = (view.pan * Math.PI) / 180;
	[ry, rz] = [
		ry * Math.cos(tilt) - rz * Math.sin(tilt),
		ry * Math.sin(tilt) + rz * Math.cos(tilt),
	];
	[rx, rz] = [
		rx * Math.cos(pan) + rz * Math.sin(pan),
		-rx * Math.sin(pan) + rz * Math.cos(pan),
	];
	if (!(rz > 1e-3)) return null;
	const a = rx / rz;
	const b = ry / rz;
	const r = Math.hypot(a, b);
	const theta = Math.atan(r);
	const t2 = theta * theta;
	const thetaD =
		theta *
		(1 +
			lens.k1 * t2 +
			lens.k2 * t2 ** 2 +
			lens.k3 * t2 ** 3 +
			lens.k4 * t2 ** 4);
	const scale = thetaD / Math.max(r, 1e-8);
	const u = lens.fx * a * scale + lens.cx;
	const v = lens.fy * b * scale + lens.cy;
	if (u < 0 || u > lens.width - 1 || v < 0 || v > lens.height - 1) return null;
	return { x: u, y: v };
}

/**
 * Source points for the border of the output, clockwise from the top-left corner,
 * `perEdge` points per edge. The corner that ends an edge is the first point of the next one.
 */
export function footprint(
	lens: Lens,
	view: View,
	output: Output,
	perEdge: number,
): (Point | null)[] {
	const { width: w, height: h } = output;
	const points: (Point | null)[] = [];
	const edges: ((t: number) => [number, number])[] = [
		(t) => [w * t, 0],
		(t) => [w, h * t],
		(t) => [w - w * t, h],
		(t) => [0, h - h * t],
	];
	for (const edge of edges) {
		for (let i = 0; i < perEdge; i++) {
			const [x, y] = edge(i / perEdge);
			points.push(sourcePoint(lens, view, output, x, y));
		}
	}
	return points;
}

/**
 * SVG path data for a footprint. A footprint without gaps is one closed outline.
 * With gaps, each run of consecutive points is an open piece; the walk starts
 * after the first gap so that a run across the end of the array stays in one piece.
 */
export function footprintPath(points: (Point | null)[]): string {
	const pair = (p: Point) =>
		`${Math.round(p.x * 10) / 10} ${Math.round(p.y * 10) / 10}`;
	const valid = points.filter((p) => p !== null);
	if (valid.length === points.length)
		return valid.length > 0 ? `M${valid.map(pair).join("L")}Z` : "";
	const gap = points.indexOf(null);
	let path = "";
	let drawing = false;
	for (let i = 1; i < points.length; i++) {
		const p = points[(gap + i) % points.length];
		if (!p) {
			drawing = false;
			continue;
		}
		path += `${drawing ? "L" : "M"}${pair(p)}`;
		drawing = true;
	}
	return path;
}

export function clampView(view: View): View {
	const clamp = (v: number, min: number, max: number) =>
		Math.min(max, Math.max(min, v));
	return {
		pan: clamp(view.pan, -MAX_ANGLE, MAX_ANGLE),
		tilt: clamp(view.tilt, -MAX_ANGLE, MAX_ANGLE),
		zoom: clamp(view.zoom, MIN_ZOOM, MAX_ZOOM),
	};
}

/** The view after dragging the output by (dx, dy) pixels: the picture follows the grab. */
export function dragView(view: View, dx: number, dy: number): View {
	const k = DEGREES_PER_PIXEL / view.zoom;
	return clampView({
		pan: view.pan - dx * k,
		tilt: view.tilt + dy * k,
		zoom: view.zoom,
	});
}

/**
 * The view after one step toward `direction` on the screen (x to the right,
 * y down), of `degrees` at zoom 1: the view turns the way the step points.
 */
export function turnView(
	view: View,
	direction: readonly [number, number],
	degrees: number,
): View {
	const k = degrees / view.zoom;
	return clampView({
		pan: view.pan + direction[0] * k,
		// A positive tilt looks up, where y is smaller.
		tilt: view.tilt - direction[1] * k,
		zoom: view.zoom,
	});
}
