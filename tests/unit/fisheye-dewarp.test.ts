import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { fisheyeOptions } from "../../src/demos/fisheye-inverse/dewarp";
import {
	CAM1,
	scaleLens,
	squareOutput,
	type View,
} from "../../src/demos/fisheye-inverse/mapping";

test("options hand the output focal length back at the input scale", () => {
	const lens = scaleLens(CAM1, 1024 / 3264);
	const options = fisheyeOptions(lens, squareOutput(lens, 720), {
		pan: 10,
		tilt: -5,
		zoom: 2,
	});
	const scale = 1024 / 3264;
	expect(options).toEqual({
		fx: expect.closeTo(991 * scale, 6),
		fy: expect.closeTo(991 * scale, 6),
		cx: expect.closeTo(1612 * scale, 6),
		cy: expect.closeTo(1617 * scale, 6),
		k1: CAM1.k1,
		k2: CAM1.k2,
		k3: CAM1.k3,
		k4: CAM1.k4,
		width: 720,
		height: 720,
		balance: 0,
		fovScale: 1,
		projection: {
			kind: "rectilinear",
			mode: "manual",
			newFx: expect.closeTo(991 * scale, 6),
			newFy: expect.closeTo(991 * scale, 6),
			newCx: 360,
			newCy: 360,
		},
		ptz: { pan: 10, tilt: -5, zoom: 2 },
	});
});

// createDewarper() with everything outside it replaced: the adapter, the
// photo, VideoFrame, the canvas and fisheye.js itself.

const LENS = scaleLens(CAM1, 1024 / 3264);
const OUTPUT = squareOutput(LENS, 720);
const view = (pan: number): View => ({ pan, tilt: 0, zoom: 1 });

interface Closable {
	close: ReturnType<typeof vi.fn>;
}
interface Pending {
	resolve(frames: Closable | Closable[]): void;
	reject(error: unknown): void;
}

function fakes() {
	const bitmap = { width: 1024, height: 1024, close: vi.fn() };
	const inputs: Closable[] = [];
	/** One entry for every undistort() that has not been answered yet. */
	const pending: Pending[] = [];
	const fisheye = {
		updateConfig: vi.fn(),
		destroy: vi.fn(),
		undistort: vi.fn(
			() =>
				new Promise<Closable | Closable[]>((resolve, reject) =>
					pending.push({ resolve, reject }),
				),
		),
	};
	const construct = vi.fn();
	const context = { drawImage: vi.fn() };
	const canvas = {
		width: 720,
		height: 720,
		getContext: () => context,
	} as unknown as HTMLCanvasElement;

	vi.stubGlobal("navigator", { gpu: { requestAdapter: async () => ({}) } });
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => ({ blob: async () => ({}) })),
	);
	vi.stubGlobal(
		"createImageBitmap",
		vi.fn(async () => bitmap),
	);
	vi.stubGlobal(
		"VideoFrame",
		class {
			close = vi.fn();
			constructor() {
				inputs.push(this);
			}
		},
	);
	vi.doMock("@gyeonghokim/fisheye.js", () => ({
		Fisheye: class {
			constructor(options: unknown) {
				construct(options);
				// biome-ignore lint/correctness/noConstructorReturn: the test keeps the one instance.
				return fisheye;
			}
		},
	}));

	const onError = vi.fn();
	const frame = (): Closable => ({ close: vi.fn() });
	/** Lets everything that can run without another answer run. */
	const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
	/** Waits until undistort() has been called `count` times in all. */
	const undistorts = (count: number) =>
		vi.waitFor(() => expect(fisheye.undistort).toHaveBeenCalledTimes(count));
	/**
	 * Starts createDewarper(). The promise is wrapped, so that awaiting
	 * start() does not wait for the dewarper.
	 */
	async function start() {
		const { createDewarper } = await import(
			"../../src/demos/fisheye-inverse/dewarp"
		);
		const created = createDewarper(canvas, "/photo.jpg", LENS, OUTPUT, onError);
		// The rejection is looked at by the test, later.
		created.catch(() => {});
		return { created };
	}
	/** A dewarper whose initial view has been drawn. */
	async function ready() {
		const { created } = await start();
		await undistorts(1);
		pending[0]?.resolve(frame());
		return created;
	}
	const pans = () =>
		fisheye.updateConfig.mock.calls.map(
			([options]) => (options as { ptz: View }).ptz.pan,
		);
	return {
		bitmap,
		inputs,
		pending,
		fisheye,
		construct,
		context,
		onError,
		frame,
		settle,
		undistorts,
		start,
		ready,
		pans,
	};
}

beforeEach(() => {
	vi.resetModules();
});
afterEach(() => {
	vi.doUnmock("@gyeonghokim/fisheye.js");
	vi.unstubAllGlobals();
});

test("the dewarper draws the initial view and closes every frame", async () => {
	const f = fakes();
	const { created } = await f.start();
	await f.undistorts(1);
	const output = f.frame();
	f.pending[0]?.resolve(output);
	const dewarper = await created;

	expect(f.construct).toHaveBeenCalledWith(
		fisheyeOptions(LENS, OUTPUT, view(0)),
	);
	expect(f.context.drawImage).toHaveBeenCalledWith(output, 0, 0, 720, 720);
	expect(f.inputs).toHaveLength(1);
	expect(f.inputs[0]?.close).toHaveBeenCalledTimes(1);
	expect(output.close).toHaveBeenCalledTimes(1);
	expect(f.bitmap.close).not.toHaveBeenCalled();

	dewarper.destroy();
	dewarper.destroy();
	expect(f.fisheye.destroy).toHaveBeenCalledTimes(1);
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
});

test("without an adapter nothing is downloaded", async () => {
	const f = fakes();
	vi.stubGlobal("navigator", { gpu: { requestAdapter: async () => null } });

	await expect((await f.start()).created).rejects.toThrow(
		"WebGPU adapter unavailable",
	);
	expect(fetch).not.toHaveBeenCalled();
	expect(f.construct).not.toHaveBeenCalled();
});

test("the photo is closed when fisheye.js cannot be loaded", async () => {
	const f = fakes();
	vi.doMock("@gyeonghokim/fisheye.js", () => {
		throw new Error("the chunk is gone");
	});

	await expect((await f.start()).created).rejects.toThrow();
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
});

test("the photo is closed when the Fisheye constructor throws", async () => {
	const f = fakes();
	f.construct.mockImplementation(() => {
		throw new Error("no device");
	});

	await expect((await f.start()).created).rejects.toThrow("no device");
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
	expect(f.fisheye.undistort).not.toHaveBeenCalled();
});

test("the photo is closed when it does not have the size of the lens", async () => {
	const f = fakes();
	f.bitmap.width = 512;

	await expect((await f.start()).created).rejects.toThrow(
		"the photo does not have the size of the lens",
	);
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
	expect(f.construct).not.toHaveBeenCalled();
});

test("a photo that cannot be fetched rejects and leaves nothing open", async () => {
	const f = fakes();
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => {
			throw new TypeError("Failed to fetch");
		}),
	);

	await expect((await f.start()).created).rejects.toThrow("Failed to fetch");
	expect(f.construct).not.toHaveBeenCalled();
	expect(f.bitmap.close).not.toHaveBeenCalled();
});

test("frames are closed when the initial view cannot be drawn", async () => {
	const f = fakes();
	f.context.drawImage.mockImplementation(() => {
		throw new Error("the canvas is lost");
	});
	const { created } = await f.start();
	await f.undistorts(1);
	const outputs = [f.frame(), f.frame()];
	f.pending[0]?.resolve(outputs);

	await expect(created).rejects.toThrow("the canvas is lost");
	for (const output of outputs) expect(output.close).toHaveBeenCalledTimes(1);
	expect(f.inputs[0]?.close).toHaveBeenCalledTimes(1);
	expect(f.fisheye.destroy).toHaveBeenCalledTimes(1);
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
	expect(f.onError).not.toHaveBeenCalled();
});

test("views asked for while one is drawn collapse into the last one", async () => {
	const f = fakes();
	const dewarper = await f.ready();

	dewarper.render(view(10));
	dewarper.render(view(20));
	dewarper.render(view(30));
	await f.settle();
	// Only the first one has started.
	expect(f.pans()).toEqual([0, 10]);
	f.pending[1]?.resolve(f.frame());
	await f.settle();
	expect(f.pans()).toEqual([0, 10, 30]);
	f.pending[2]?.resolve(f.frame());
	await f.settle();

	expect(f.pans()).toEqual([0, 10, 30]);
	expect(f.fisheye.undistort).toHaveBeenCalledTimes(3);
	expect(f.context.drawImage).toHaveBeenCalledTimes(3);
	for (const input of f.inputs) expect(input.close).toHaveBeenCalledTimes(1);
	expect(f.onError).not.toHaveBeenCalled();

	// Idle again: the next view is drawn at once.
	dewarper.render(view(40));
	await f.settle();
	expect(f.pans()).toEqual([0, 10, 30, 40]);
});

test("a later error goes to onError once and nothing is drawn after it", async () => {
	const f = fakes();
	const dewarper = await f.ready();

	dewarper.render(view(10));
	dewarper.render(view(20));
	await f.settle();
	const lost = new Error("the device was lost");
	f.pending[1]?.reject(lost);
	await f.settle();

	expect(f.onError).toHaveBeenCalledTimes(1);
	expect(f.onError).toHaveBeenCalledWith(lost);
	expect(f.fisheye.destroy).toHaveBeenCalledTimes(1);
	expect(f.bitmap.close).toHaveBeenCalledTimes(1);
	expect(f.inputs[1]?.close).toHaveBeenCalledTimes(1);

	dewarper.render(view(30));
	await f.settle();
	expect(f.pans()).toEqual([0, 10]);
	expect(f.onError).toHaveBeenCalledTimes(1);
});

test("a frame that arrives after destroy() is closed and not drawn", async () => {
	const f = fakes();
	const dewarper = await f.ready();

	dewarper.render(view(10));
	await f.settle();
	dewarper.destroy();
	const late = f.frame();
	f.pending[1]?.resolve(late);
	await f.settle();

	expect(f.context.drawImage).toHaveBeenCalledTimes(1);
	expect(late.close).toHaveBeenCalledTimes(1);
	expect(f.onError).not.toHaveBeenCalled();
});
