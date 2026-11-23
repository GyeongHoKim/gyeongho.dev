// The dewarped view drawn by fisheye.js, which needs WebGPU. The library is
// imported inside createDewarper(): a browser without WebGPU never loads it.

import type { Fisheye } from "@gyeonghokim/fisheye.js";
import { INITIAL_VIEW, type Lens, type Output, type View } from "./mapping";

export interface DewarpOptions {
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
	balance: number;
	fovScale: number;
	projection: {
		kind: "rectilinear";
		mode: "manual";
		newFx: number;
		newFy: number;
		newCx: number;
		newCy: number;
	};
	ptz: { pan: number; tilt: number; zoom: number };
}

/**
 * What `new Fisheye()` and `updateConfig()` take for this lens, output and view.
 * fisheye.js multiplies `newFx` by output width / input width, so the focal
 * length of the output goes back to the scale of the input.
 */
export function fisheyeOptions(
	lens: Lens,
	output: Output,
	view: View,
): DewarpOptions {
	return {
		fx: lens.fx,
		fy: lens.fy,
		cx: lens.cx,
		cy: lens.cy,
		k1: lens.k1,
		k2: lens.k2,
		k3: lens.k3,
		k4: lens.k4,
		width: output.width,
		height: output.height,
		balance: 0,
		fovScale: 1,
		projection: {
			kind: "rectilinear",
			mode: "manual",
			newFx: (output.fx * lens.width) / output.width,
			newFy: (output.fy * lens.height) / output.height,
			newCx: output.cx,
			newCy: output.cy,
		},
		ptz: { pan: view.pan, tilt: view.tilt, zoom: view.zoom },
	};
}

export interface Dewarper {
	/** Draws the view on the canvas; a call made while one is drawn replaces the one waiting. */
	render(view: View): void;
	destroy(): void;
}

/**
 * Draws the dewarped photo on `canvas`. Resolves once the initial view is
 * drawn and rejects when that cannot be done, for example without an adapter.
 * An error in a later `render()` goes to `onError`, and nothing is drawn after it.
 */
export async function createDewarper(
	canvas: HTMLCanvasElement,
	photoUrl: string,
	lens: Lens,
	output: Output,
	onError: (error: unknown) => void,
): Promise<Dewarper> {
	// Asked before anything is downloaded: some browsers have navigator.gpu and no adapter.
	if (!(await navigator.gpu?.requestAdapter()))
		throw new Error("WebGPU adapter unavailable");
	const context = canvas.getContext("2d");
	if (!context) throw new Error("2D canvas context unavailable");

	// Both are awaited to the end: a photo that arrives after the library has
	// failed must still be closed.
	const [library, photo] = await Promise.allSettled([
		import("@gyeonghokim/fisheye.js"),
		fetch(photoUrl)
			.then((response) => response.blob())
			.then((blob) => createImageBitmap(blob)),
	]);
	if (photo.status === "rejected") throw photo.reason;
	const bitmap = photo.value;
	let fisheye: Fisheye;
	try {
		if (library.status === "rejected") throw library.reason;
		// The lens is measured on a photo of this size.
		if (bitmap.width !== lens.width || bitmap.height !== lens.height)
			throw new Error("the photo does not have the size of the lens");
		fisheye = new library.value.Fisheye(
			fisheyeOptions(lens, output, INITIAL_VIEW),
		);
	} catch (error) {
		bitmap.close();
		throw error;
	}

	let stopped = false;
	function stop() {
		if (stopped) return;
		stopped = true;
		fisheye.destroy();
		bitmap.close();
	}

	async function draw(view: View) {
		fisheye.updateConfig(fisheyeOptions(lens, output, view));
		const input = new VideoFrame(bitmap, { timestamp: 0 });
		let result: VideoFrame | VideoFrame[];
		try {
			result = await fisheye.undistort(input);
		} finally {
			input.close();
		}
		const frames = Array.isArray(result) ? result : [result];
		try {
			const [frame] = frames;
			if (frame && !stopped)
				context?.drawImage(frame, 0, 0, canvas.width, canvas.height);
		} finally {
			for (const each of frames) each.close();
		}
	}

	// One undistort at a time; the views asked for meanwhile collapse into the last one.
	let busy = false;
	let waiting: View | null = null;
	async function render(view: View) {
		if (stopped) return;
		if (busy) {
			waiting = view;
			return;
		}
		busy = true;
		try {
			let next: View | null = view;
			while (next && !stopped) {
				waiting = null;
				await draw(next);
				next = waiting;
			}
		} catch (error) {
			if (!stopped) {
				stop();
				onError(error);
			}
		} finally {
			busy = false;
		}
	}

	try {
		await draw(INITIAL_VIEW);
	} catch (error) {
		stop();
		throw error;
	}
	return {
		render: (view) => void render(view),
		destroy: stop,
	};
}
