import { readFile } from "node:fs/promises";
import type { GhSlider } from "@ghds/web-components/slider";
import { expect, type Locator, type Page, test } from "@playwright/test";
import sharp from "sharp";
import {
	CAM1,
	dragView,
	INITIAL_VIEW,
	scaleLens,
	sourcePoint,
	squareOutput,
	type View,
} from "../../src/demos/fisheye-inverse/mapping";
import {
	type RawImage,
	sampleBilinear,
} from "../../src/demos/fisheye-inverse/resample";

declare global {
	interface Window {
		__keys: KeyboardEvent[];
		__devices: { made: number; lost: number };
		__answerGpu?: () => void;
	}
}

const POST = "/ko/blog/fisheye-dewarping-inverse-mapping/";
const VIEW_SIZE = 720;
const NO_GPU =
	"WebGPU를 쓸 수 없어서 펴진 화면을 정지 그림으로 보여 드립니다. 점을 가리키는 조작은 그대로 됩니다.";
const HINT =
	"펴진 화면을 드래그하거나, 펴진 화면에 초점을 두고 방향키를 눌러서 시점을 돌립니다.";
const VIEW_LABEL = "펴진 화면. 방향키로 시점을 돌립니다.";
const PHOTO_ALT =
	"어안 사진 원본입니다. 펴진 화면이 읽는 영역의 윤곽이 그려져 있습니다.";
const VIEW_ALT = "원본의 윤곽 안쪽을 편 화면입니다.";
/**
 * The most the canvas of fisheye.js may differ from the site's own
 * calculation: the mean of a channel, out of 255. The two differ by about 2;
 * a lens without its distortion or with a swapped centre differs by 9 or more.
 */
const SAME_PICTURE = 4;

/**
 * What the page finds in `navigator.gpu`: nothing, an object that gives no
 * adapter, one that never answers, or what the browser really has.
 */
type Gpu = "absent" | "no-adapter" | "no-answer" | "real";

/**
 * Opens the post with the demo ready. CI has no WebGPU; `navigator.gpu` is
 * removed unless a test asks otherwise, so that a machine with WebGPU runs
 * the same demo.
 */
async function openDemo(page: Page, gpu: Gpu = "absent") {
	if (gpu !== "real") {
		await page.addInitScript((gpu) => {
			const adapter =
				gpu === "no-answer"
					? new Promise<null>(() => {})
					: Promise.resolve(null);
			const value =
				gpu === "absent" ? undefined : { requestAdapter: () => adapter };
			Object.defineProperty(Navigator.prototype, "gpu", {
				configurable: true,
				get: () => value,
			});
		}, gpu);
	}
	// Every keydown, as the page saw it first: a handler of the demo that
	// stops the event would hide it from a listener in the bubble phase.
	await page.addInitScript(() => {
		window.__keys = [];
		window.addEventListener("keydown", (event) => window.__keys.push(event), {
			capture: true,
		});
	});
	await page.goto(POST);
	const host = page.locator("demo-fisheye-inverse");
	await host.scrollIntoViewIfNeeded();
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	return {
		host,
		root: host.locator(".fi"),
		source: host.locator('[data-pane="source"]'),
		pane: host.locator('[data-pane="view"]'),
		view: host.getByTestId("fi-view"),
		cross: host.getByTestId("fi-cross"),
		dot: host.getByTestId("fi-dot"),
		link: host.getByTestId("fi-link"),
		linkHalo: host.getByTestId("fi-link-halo"),
		footprint: host.getByTestId("fi-footprint"),
		readout: host.getByTestId("fi-readout"),
		status: host.getByTestId("fi-status"),
		hint: host.getByTestId("fi-hint"),
		notice: host.getByTestId("fi-notice"),
		photo: host.locator(".fi-photo"),
		still: host.locator(".fi-still"),
		canvas: host.locator(".fi-canvas"),
		slider: host.locator("gh-slider"),
	};
}

type Demo = Awaited<ReturnType<typeof openDemo>>;

/** Whether the demo stopped the default action of each press of `key`, oldest first. */
function prevented(page: Page, key: string) {
	return page.evaluate(
		(key) =>
			window.__keys
				.filter((event) => event.key === key)
				.map((event) => event.defaultPrevented),
		key,
	);
}

/** The view is a still image, and pointing at it works as before. */
async function expectStillView(page: Page, demo: Demo) {
	await expect(demo.root).toHaveAttribute("data-gpu", "off");
	await expect(demo.notice).toBeVisible();
	await expect(demo.notice).toHaveText(NO_GPU);
	// The hint tells how to turn the view, which a still image cannot do.
	await expect(demo.hint).toBeHidden();
	await expect(demo.still).toBeVisible();
	// The dewarped picture, not the photo, which is 1024 wide.
	await expect
		.poll(() =>
			demo.still.evaluate((image: HTMLImageElement) => image.naturalWidth),
		)
		.toBe(VIEW_SIZE);
	await expect(demo.still).toHaveAttribute("alt", VIEW_ALT);
	await expect(demo.canvas).toHaveCount(0);
	await expect(demo.slider).toHaveAttribute("disabled");
	await expect(demo.view).not.toHaveAttribute("tabindex");
	await expect(demo.readout).toContainText("pan 0° · tilt 0° · zoom 1.0×");

	await demo.cross.focus();
	await page.keyboard.press("ArrowRight");
	await expect(demo.readout).toContainText("펴진 화면 (396, 360)");
}

async function box(locator: Locator) {
	const found = await locator.boundingBox();
	if (!found) throw new Error("the element has no box");
	return found;
}

async function number(locator: Locator, attribute: string) {
	return Number(await locator.getAttribute(attribute));
}

/** The view the readout names; the angles are rounded to whole degrees. */
async function shownView(readout: Locator): Promise<View> {
	const match = /pan (-?\d+)° · tilt (-?\d+)° · zoom ([\d.]+)×/.exec(
		(await readout.textContent()) ?? "",
	);
	if (!match) throw new Error("the readout names no view");
	return {
		pan: Number(match[1]),
		tilt: Number(match[2]),
		zoom: Number(match[3]),
	};
}

/** The output pixel the readout names. */
async function pointed(readout: Locator) {
	const match = /펴진 화면 \((\d+), (\d+)\)/.exec(
		(await readout.textContent()) ?? "",
	);
	if (!match) throw new Error("the readout names no output pixel");
	return { x: Number(match[1]), y: Number(match[2]) };
}

function horizontalOverflow(page: Page) {
	return page.evaluate(
		() =>
			document.documentElement.scrollWidth -
			document.documentElement.clientWidth,
	);
}

/**
 * The ends of the link, and the centres of the crosshair and of the dot, all
 * in CSS pixels from the top-left corner of `.fi-panes`.
 */
function linkGeometry(page: Page) {
	return page.evaluate(() => {
		const find = (selector: string) => {
			const element = document.querySelector(selector);
			if (!element) throw new Error(`${selector} is missing`);
			return element;
		};
		const origin = find(".fi-panes").getBoundingClientRect();
		const centre = (selector: string) => {
			const rect = find(selector).getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2 - origin.left,
				y: rect.top + rect.height / 2 - origin.top,
			};
		};
		const line = find('[data-testid="fi-link"]');
		const halo = find('[data-testid="fi-link-halo"]');
		const end = (of: Element, x: string, y: string) => ({
			x: Number(of.getAttribute(x)),
			y: Number(of.getAttribute(y)),
		});
		const strokeWidth = (of: Element) =>
			Number.parseFloat(getComputedStyle(of).strokeWidth);
		return {
			start: end(line, "x1", "y1"),
			finish: end(line, "x2", "y2"),
			cross: centre('[data-testid="fi-cross"]'),
			dot: centre('[data-testid="fi-dot"]'),
			dotRadius:
				find('[data-testid="fi-dot"]').getBoundingClientRect().width / 2,
			haloStart: end(halo, "x1", "y1"),
			haloFinish: end(halo, "x2", "y2"),
			width: strokeWidth(line),
			haloWidth: strokeWidth(halo),
			haloPaintedFirst: Boolean(
				halo.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING,
			),
			colour: getComputedStyle(line).stroke,
			haloColour: getComputedStyle(halo).stroke,
		};
	});
}

async function expectLinkAttached(page: Page) {
	await expect(async () => {
		const link = await linkGeometry(page);
		const { start, finish, cross, dot } = link;
		expect(Math.abs(start.x - cross.x)).toBeLessThanOrEqual(2);
		expect(Math.abs(start.y - cross.y)).toBeLessThanOrEqual(2);
		expect(Math.abs(finish.x - dot.x)).toBeLessThanOrEqual(2);
		expect(Math.abs(finish.y - dot.y)).toBeLessThanOrEqual(2);

		// The halo lies under the link, from the same start to the edge of the dot.
		const distance = (a: typeof start, b: typeof start) =>
			Math.hypot(a.x - b.x, a.y - b.y);
		expect(link.haloStart).toEqual(start);
		const short = distance(link.haloFinish, finish);
		expect(short).toBeGreaterThan(0);
		expect(short).toBeLessThanOrEqual(link.dotRadius + 1);
		expect(
			Math.abs(
				distance(start, link.haloFinish) + short - distance(start, finish),
			),
		).toBeLessThanOrEqual(0.5);
		expect(link.haloWidth).toBeGreaterThan(link.width);
		expect(link.haloPaintedFirst).toBe(true);
		expect(link.haloColour).not.toBe(link.colour);
	}).toPass();
}

/** The two frames, in CSS pixels of the page. */
async function frames(demo: Demo) {
	return {
		source: await box(demo.source.locator(".fi-frame")),
		view: await box(demo.view),
	};
}

let photo: Promise<RawImage> | undefined;
/** cam1.jpg as the demo's own calculation reads it. */
function photoPixels(): Promise<RawImage> {
	photo ??= sharp("src/assets/home/cam1.jpg")
		.removeAlpha()
		.toColourspace("srgb")
		.raw()
		.toBuffer({ resolveWithObject: true })
		.then(({ data, info }) => ({
			data,
			width: info.width,
			height: info.height,
			channels: info.channels,
		}));
	return photo;
}

/** One pixel in eight each way: enough to tell two views apart. */
const GRID = 8;

/**
 * How far the canvas is from `view` as mapping.ts and resample.ts draw it:
 * the largest mean difference of a channel, out of 255.
 */
async function canvasDifference(canvas: Locator, view: View) {
	const image = await photoPixels();
	const lens = scaleLens(CAM1, image.width / CAM1.width);
	const output = squareOutput(lens, VIEW_SIZE);
	const drawn = await canvas.evaluate(
		(element: HTMLCanvasElement, { size, grid }) => {
			const context = element.getContext("2d");
			if (!context) throw new Error("no 2D context");
			const { data } = context.getImageData(0, 0, size, size);
			const values: number[] = [];
			for (let y = grid / 2; y < size; y += grid)
				for (let x = grid / 2; x < size; x += grid)
					for (let c = 0; c < 3; c++) values.push(data[(y * size + x) * 4 + c]);
			return values;
		},
		{ size: VIEW_SIZE, grid: GRID },
	);
	const sums = [0, 0, 0];
	let index = 0;
	for (let y = GRID / 2; y < VIEW_SIZE; y += GRID)
		for (let x = GRID / 2; x < VIEW_SIZE; x += GRID) {
			const source = sourcePoint(lens, view, output, x, y);
			const expected = source
				? sampleBilinear(image, source.x, source.y)
				: [0, 0, 0];
			for (let c = 0; c < 3; c++)
				sums[c] += Math.abs((drawn[index++] ?? 0) - (expected[c] ?? 0));
		}
	return Math.max(...sums) / (index / 3);
}

/** The canvas shows `view`, drawn again after the last change. */
async function expectCanvasShows(canvas: Locator, view: View) {
	await expect
		.poll(() => canvasDifference(canvas, view))
		.toBeLessThanOrEqual(SAME_PICTURE);
}

test("the crosshair starts at the centre", async ({ page }) => {
	const { readout, footprint, dot } = await openDemo(page);

	expect(await page.evaluate(() => "gpu" in navigator && navigator.gpu)).toBe(
		undefined,
	);
	await expect(readout).toContainText("펴진 화면 (360, 360) → 원본 (506, 507)");
	expect(await footprint.getAttribute("d")).toMatch(/^M.+Z$/);
	await expect(dot).toBeVisible();
});

test("the panes and the controls are named", async ({ page }) => {
	const demo = await openDemo(page);

	// The post calls the two pictures by these names.
	await expect(demo.source.locator("figcaption")).toHaveText("원본");
	await expect(demo.pane.locator("figcaption")).toHaveText("펴진 화면");
	await expect(demo.cross).toHaveAccessibleName(
		"가리키는 점. 방향키로 움직입니다.",
	);
	await expect(demo.slider).toHaveAttribute("label", "Zoom");
	// A reader who cannot see the pictures is told what they are.
	await expect(demo.host.getByRole("img", { name: PHOTO_ALT })).toBeVisible();
	await expect(demo.host.getByRole("img", { name: VIEW_ALT })).toBeVisible();
	expect(
		await demo.photo.evaluate((image: HTMLImageElement) => image.naturalWidth),
	).toBe(1024);
});

test("the panes are side by side, and stacked on a narrow screen", async ({
	page,
}) => {
	const demo = await openDemo(page);
	const { source, view } = await frames(demo);

	expect(Math.abs(view.width - source.width)).toBeLessThanOrEqual(1);
	if ((page.viewportSize()?.width ?? 0) <= 640) {
		expect(view.y).toBeGreaterThanOrEqual(source.y + source.height);
		expect(Math.abs(view.x - source.x)).toBeLessThanOrEqual(1);
	} else {
		expect(Math.abs(view.y - source.y)).toBeLessThanOrEqual(1);
		expect(view.x).toBeGreaterThanOrEqual(source.x + source.width);
	}
});

test("arrow keys move the pointed pixel", async ({ page }) => {
	const { cross, dot, readout } = await openDemo(page);
	await cross.focus();
	const before = await number(dot, "cx");

	await page.keyboard.press("ArrowRight");
	await expect(readout).toContainText("펴진 화면 (396, 360)");
	expect(await number(dot, "cx")).toBeGreaterThan(before);

	await page.keyboard.press("Shift+ArrowRight");
	await expect(readout).toContainText("펴진 화면 (402, 360)");

	// The arrow keys move the pixel, not the page. The page would scroll in
	// an animation that starts after the key, so the event itself is asked.
	const scrolled = await page.evaluate(() => window.scrollY);
	await page.keyboard.press("ArrowDown");
	await expect(readout).toContainText("펴진 화면 (402, 396)");
	expect(await prevented(page, "ArrowDown")).toEqual([true]);
	expect(await prevented(page, "ArrowRight")).toEqual([true, true]);
	expect(await page.evaluate(() => window.scrollY)).toBe(scrolled);
});

test("a screen reader hears the keys, not every pointer move", async ({
	page,
}) => {
	const { cross, view, readout, status } = await openDemo(page);
	const frame = await box(view);

	// The readout changes with every pointer move; it is not a live region.
	await expect(readout).not.toHaveAttribute("aria-live");
	await expect(status).toHaveAttribute("aria-live", "polite");
	const start = await readout.textContent();
	await page.mouse.move(frame.x + 10, frame.y + 10);
	await page.mouse.move(frame.x + frame.width - 10, frame.y + 60, {
		steps: 40,
	});
	await expect(readout).not.toHaveText(start ?? "");
	await expect(status).toBeEmpty();

	await cross.focus();
	await page.keyboard.press("ArrowRight");
	const line = (await readout.textContent()) ?? "";
	expect(line).toContain("펴진 화면");
	await expect(status).toHaveText(line);
	// It is there for a screen reader only.
	const size = await box(status);
	expect(size.width).toBeLessThanOrEqual(1);
	expect(size.height).toBeLessThanOrEqual(1);
});

test("crosshair stops at the edge", async ({ page }) => {
	const { cross, view, readout } = await openDemo(page);
	await cross.focus();

	for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowLeft");
	await expect(readout).toContainText("펴진 화면 (0, 360)");
	const target = await box(cross);
	const frame = await box(view);
	expect(Math.abs(target.x + target.width / 2 - frame.x)).toBeLessThanOrEqual(
		1,
	);

	// At the far edge the crosshair sticks out of the frame, not out of the page.
	for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowRight");
	await expect(readout).toContainText("펴진 화면 (720, 360)");
	const far = await box(cross);
	expect(
		Math.abs(far.x + far.width / 2 - (frame.x + frame.width)),
	).toBeLessThanOrEqual(1);
	expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test("pointing with the mouse moves the pixel", async ({ page }) => {
	const { view, readout } = await openDemo(page);
	const frame = await box(view);

	await view.hover({
		position: { x: frame.width / 4, y: frame.height / 4 },
	});
	await expect
		.poll(async () => Math.abs((await pointed(readout)).x - 180))
		.toBeLessThanOrEqual(2);
	expect(Math.abs((await pointed(readout)).y - 180)).toBeLessThanOrEqual(2);

	const text = await readout.textContent();
	await page.mouse.move(1, 1);
	await page.mouse.move(2, 2);
	expect(await readout.textContent()).toBe(text);
});

test.describe("on a touch screen", () => {
	test.use({ hasTouch: true });

	test("a tap points at the pixel", async ({ page }) => {
		const { view, readout } = await openDemo(page);
		const frame = await box(view);

		await view.tap({
			position: { x: frame.width / 4, y: (frame.height * 3) / 4 },
		});
		await expect
			.poll(async () => Math.abs((await pointed(readout)).x - 180))
			.toBeLessThanOrEqual(2);
		expect(Math.abs((await pointed(readout)).y - 540)).toBeLessThanOrEqual(2);
	});
});

test("the crosshair is drawn in forced colours", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" });
	const { cross } = await openDemo(page);

	expect(
		await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
	).toBe(true);
	// Forced colours remove background images, and the cross is one.
	expect(
		await cross.evaluate(
			(button) => getComputedStyle(button, "::before").backgroundImage,
		),
	).toContain("linear-gradient");
});

test("link follows a resize", async ({ page }) => {
	const { cross, readout } = await openDemo(page);
	// Away from the centre, where a link that is off by a pane would still fit.
	await cross.focus();
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowRight");
	await page.keyboard.press("ArrowUp");
	await expect(readout).toContainText("펴진 화면 (432, 324)");
	await expectLinkAttached(page);

	const height = page.viewportSize()?.height ?? 900;
	// 900 puts the panes side by side, 500 stacks them.
	for (const width of [900, 500]) {
		await page.setViewportSize({ width, height });
		await expectLinkAttached(page);
	}
});

test("the crosshair is a 44px target", async ({ page }) => {
	const { cross } = await openDemo(page);
	const target = await box(cross);

	expect(target.width).toBeGreaterThanOrEqual(44);
	expect(target.height).toBeGreaterThanOrEqual(44);
});

test("without WebGPU the view is a still image", async ({ page }) => {
	const demo = await openDemo(page);

	await expectStillView(page, demo);
});

test("without WebGPU a click on the view leaves the focus on the crosshair", async ({
	page,
}) => {
	const demo = await openDemo(page);
	await expect(demo.root).toHaveAttribute("data-gpu", "off");
	const frame = await box(demo.view);

	// The frame cannot have the focus, and the crosshair is under the pointer.
	await page.mouse.click(
		frame.x + frame.width * 0.3,
		frame.y + frame.height * 0.3,
	);
	await expect(demo.cross).toBeFocused();
	const place = await pointed(demo.readout);
	expect(Math.abs(place.x - VIEW_SIZE * 0.3)).toBeLessThanOrEqual(2);
	await page.keyboard.press("ArrowRight");
	await expect
		.poll(() => pointed(demo.readout))
		.toEqual({ ...place, x: place.x + 36 });
	await expect(demo.readout).toContainText("pan 0° · tilt 0°");
});

test("the hint has its room before WebGPU answers", async ({ page }) => {
	const demo = await openDemo(page, "no-answer");

	// The demo is ready with the still image; whether the view can be turned
	// is not known yet, so the hint is not shown and the notice neither.
	await expect(demo.root).not.toHaveAttribute("data-gpu");
	await expect(demo.still).toBeVisible();
	await expect(demo.notice).toBeHidden();
	await expect(demo.hint).toBeHidden();
	// Its row is there already, so nothing moves down when the hint appears.
	const row = await box(demo.hint);
	expect(row.height).toBeGreaterThan(0);
	expect((await box(demo.slider)).y).toBeGreaterThanOrEqual(row.y + row.height);
});

/** The scripts the page asks for until the demo shows its still image. */
async function scriptsForStillView(page: Page, gpu: Gpu) {
	const scripts = new Set<string>();
	page.on("request", (request) => {
		const { pathname } = new URL(request.url());
		if (pathname.endsWith(".js")) scripts.add(pathname);
	});
	const demo = await openDemo(page, gpu);
	await expectStillView(page, demo);
	await page.waitForLoadState("networkidle");
	return [...scripts].sort();
}

test("adapter is null", async ({ page, browser, baseURL }) => {
	const errors: Error[] = [];
	page.on("pageerror", (error) => errors.push(error));
	const scripts = await scriptsForStillView(page, "no-adapter");

	expect(
		await page.evaluate(async () => await navigator.gpu.requestAdapter()),
	).toBe(null);
	expect(errors).toEqual([]);

	// The adapter is asked for before anything is downloaded: fisheye.js is
	// not among the scripts, which are those of a browser without WebGPU.
	const context = await browser.newContext({
		baseURL,
		viewport: page.viewportSize(),
	});
	try {
		const absent = await scriptsForStillView(await context.newPage(), "absent");
		expect(scripts.length).toBeGreaterThan(0);
		expect(scripts).toEqual(absent);
	} finally {
		await context.close();
	}
});

test.describe("with WebGPU", () => {
	/** Opens the demo with what the browser has; skips the test without an adapter. */
	async function openLiveDemo(page: Page) {
		const demo = await openDemo(page, "real");
		const hasAdapter = await page.evaluate(async () =>
			Boolean(await navigator.gpu?.requestAdapter()),
		);
		test.skip(!hasAdapter, "this browser gives no WebGPU adapter");
		await expect(demo.root).toHaveAttribute("data-gpu", "on");
		return demo;
	}

	/** Where the pointer goes down for a drag: away from the crosshair. */
	async function grabPoint(demo: Demo) {
		const frame = await box(demo.view);
		return { x: frame.x + frame.width * 0.3, y: frame.y + frame.height * 0.3 };
	}

	/** How far down the photo the outline of the view lies: the mean y of its points. */
	async function outlineMiddle(footprint: Locator) {
		const ys = ((await footprint.getAttribute("d")) ?? "")
			.split(/[MLZ]/)
			.filter((pair) => pair !== "")
			.map((pair) => Number(pair.split(" ")[1]));
		if (ys.length === 0) throw new Error("the outline has no points");
		return ys.reduce((sum, y) => sum + y, 0) / ys.length;
	}

	/** Whether the frame of the view shows the ring of the keyboard focus. */
	function ringShown(view: Locator) {
		return view.evaluate(
			(frame) => getComputedStyle(frame).outlineStyle !== "none",
		);
	}

	/** From now on fisheye.js cannot be given a frame: the next redraw fails. */
	function breakRedraw(page: Page) {
		return page.evaluate(() => {
			window.VideoFrame = class {
				constructor() {
					throw new Error("no frame");
				}
			} as unknown as typeof VideoFrame;
		});
	}

	/** The demo after a failed redraw: the still image at the initial view. */
	async function expectFallenBack(demo: Demo) {
		await expect(demo.root).toHaveAttribute("data-gpu", "off");
		await expect(demo.notice).toBeVisible();
		await expect(demo.notice).toHaveText(NO_GPU);
		await expect(demo.hint).toBeHidden();
		await expect(demo.canvas).toHaveCount(0);
		await expect(demo.still).toBeVisible();
		await expect(demo.slider).toHaveAttribute("disabled");
		expect(await demo.slider.evaluate((slider: GhSlider) => slider.value)).toBe(
			1,
		);
		await expect(demo.view).not.toHaveAttribute("tabindex");
		await expect(demo.view).not.toHaveAttribute("role");
		await expect(demo.view).not.toHaveAttribute("data-grabbing");
		await expect(demo.readout).toContainText("pan 0° · tilt 0° · zoom 1.0×");
		// The keyboard reader is left on a control that still works.
		await expect(demo.cross).toBeFocused();
	}

	test("with WebGPU the canvas matches the still image", async ({ page }) => {
		const demo = await openLiveDemo(page);

		await expect(demo.canvas).toBeVisible();
		await expect(demo.notice).toBeHidden();
		// The room of the notice tells how to turn the view.
		await expect(demo.hint).toBeVisible();
		await expect(demo.hint).toHaveText(HINT);
		// A screen reader is told the same as the hint.
		await expect(demo.view).toHaveAccessibleName(VIEW_LABEL);
		await expect(demo.host.getByRole("img", { name: VIEW_ALT })).toBeVisible();
		// One finger turns the view; two still zoom the page.
		await expect(demo.view).toHaveCSS("touch-action", "pinch-zoom");

		// dewarped.jpg is drawn by the site's own calculation, the canvas by fisheye.js.
		const still = await readFile("src/demos/fisheye-inverse/dewarped.jpg");
		const difference = await demo.canvas.evaluate(
			async (canvas: HTMLCanvasElement, { url, size }) => {
				const image = new Image();
				image.src = url;
				await image.decode();
				const expected = document.createElement("canvas");
				expected.width = size;
				expected.height = size;
				const pixels = (source: HTMLCanvasElement) => {
					const context = source.getContext("2d");
					if (!context) throw new Error("no 2D context");
					return context.getImageData(0, 0, size, size).data;
				};
				expected.getContext("2d")?.drawImage(image, 0, 0, size, size);
				const a = pixels(canvas);
				const b = pixels(expected);
				const sums = [0, 0, 0];
				for (let i = 0; i < a.length; i += 4)
					for (let c = 0; c < 3; c++) sums[c] += Math.abs(a[i + c] - b[i + c]);
				return sums.map((sum) => sum / (size * size));
			},
			{
				url: `data:image/jpeg;base64,${still.toString("base64")}`,
				size: VIEW_SIZE,
			},
		);
		expect(await demo.canvas.getAttribute("width")).toBe(String(VIEW_SIZE));
		for (const channel of difference)
			expect(channel).toBeLessThanOrEqual(SAME_PICTURE);

		const outline = await demo.footprint.getAttribute("d");
		await demo.view.focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("pan 5°");
		expect(await demo.footprint.getAttribute("d")).not.toBe(outline);
	});

	test("nothing under the pictures moves when the view becomes live", async ({
		page,
	}) => {
		// The adapter is given when the test says so: the demo is ready before.
		await page.addInitScript(() => {
			if (!("GPU" in window)) return;
			const request = GPU.prototype.requestAdapter;
			const answer = new Promise<void>((resolve) => {
				window.__answerGpu = resolve;
			});
			GPU.prototype.requestAdapter = async function (...args) {
				await answer;
				return request.apply(this, args);
			};
		});
		const demo = await openDemo(page, "real");
		const rows = async () => [await box(demo.slider), await box(demo.readout)];
		const before = await rows();

		await page.evaluate(() => window.__answerGpu?.());
		const hasAdapter = await page.evaluate(async () =>
			Boolean(await navigator.gpu?.requestAdapter()),
		);
		test.skip(!hasAdapter, "this browser gives no WebGPU adapter");
		await expect(demo.root).toHaveAttribute("data-gpu", "on");
		await expect(demo.hint).toBeVisible();
		expect(await rows()).toEqual(before);
	});

	test("the canvas is drawn again when the view turns", async ({ page }) => {
		const demo = await openLiveDemo(page);
		await expectCanvasShows(demo.canvas, INITIAL_VIEW);

		await demo.view.focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("pan 5°");
		const turned = { pan: 5, tilt: 0, zoom: 1 };
		await expectCanvasShows(demo.canvas, turned);
		// Five degrees are far more than the noise between the two calculations.
		expect(await canvasDifference(demo.canvas, INITIAL_VIEW)).toBeGreaterThan(
			3 * SAME_PICTURE,
		);
	});

	test("a drag turns the view until the pointer is released", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);
		const from = await grabPoint(demo);

		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await expect(demo.view).toHaveAttribute("data-grabbing");
		await page.mouse.move(from.x + 40, from.y + 20, { steps: 8 });
		// The picture follows the grab: 40px right and 20px down are about
		// 20° of pan to the left and 10° of tilt upwards at both widths.
		await expect
			.poll(async () => (await shownView(demo.readout)).pan)
			.toBeLessThanOrEqual(-18);
		const dragged = await shownView(demo.readout);
		expect(dragged.pan).toBeGreaterThanOrEqual(-23);
		expect(dragged.tilt).toBeGreaterThanOrEqual(8);
		expect(dragged.tilt).toBeLessThanOrEqual(12);
		// The readout rounds its angles; the canvas shows the view of the whole drag.
		const scale = VIEW_SIZE / (await box(demo.view)).width;
		await expectCanvasShows(
			demo.canvas,
			dragView(INITIAL_VIEW, 40 * scale, 20 * scale),
		);

		await page.mouse.up();
		await expect(demo.view).not.toHaveAttribute("data-grabbing");
		const place = await pointed(demo.readout);
		await page.mouse.move(from.x + 80, from.y + 50, { steps: 4 });
		await expect
			.poll(async () => (await pointed(demo.readout)).x)
			.toBeGreaterThan(place.x);
		expect(await shownView(demo.readout)).toEqual(dragged);
	});

	test("another pointer that leaves the view does not end the drag", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);
		const from = await grabPoint(demo);

		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await page.mouse.move(from.x + 10, from.y, { steps: 2 });
		await expect
			.poll(async () => (await shownView(demo.readout)).pan)
			.toBeLessThanOrEqual(-4);
		const first = await shownView(demo.readout);

		// A second finger touches the picture and lifts.
		const place = await pointed(demo.readout);
		for (const type of ["pointerdown", "pointermove", "pointerup"])
			await demo.view.dispatchEvent(type, {
				pointerId: 99,
				isPrimary: false,
				bubbles: true,
				clientX: from.x + 100,
				clientY: from.y + 100,
			});
		await expect(demo.view).toHaveAttribute("data-grabbing");
		expect(await pointed(demo.readout)).toEqual(place);

		await page.mouse.move(from.x + 60, from.y, { steps: 5 });
		await expect
			.poll(async () => (await shownView(demo.readout)).pan)
			.toBeLessThanOrEqual(first.pan - 20);
		await page.mouse.up();
		await expect(demo.view).not.toHaveAttribute("data-grabbing");
	});

	test("the slider zooms and the arrow keys turn the view", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);
		const outline = await demo.footprint.getAttribute("d");

		await expect(demo.slider).not.toHaveAttribute("disabled");
		await demo.slider.locator("input").focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("zoom 1.1×");
		expect(await demo.footprint.getAttribute("d")).not.toBe(outline);
		await expectCanvasShows(demo.canvas, { pan: 0, tilt: 0, zoom: 1.1 });

		for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("zoom 2.0×");

		// At zoom 2 a key turns the view by half of its 5°. Right pans to the
		// right and Up raises the tilt, which looks up.
		await demo.view.focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("pan 3° · tilt 0° · zoom 2.0×");
		const level = await outlineMiddle(demo.footprint);
		await page.keyboard.press("ArrowUp");
		await expect(demo.readout).toContainText("pan 3° · tilt 3° · zoom 2.0×");
		await expect(demo.status).toHaveText(
			(await demo.readout.textContent()) ?? "",
		);
		// The view reads what is higher on the photo, and shows it.
		expect(await outlineMiddle(demo.footprint)).toBeLessThan(level);
		await expectCanvasShows(demo.canvas, { pan: 2.5, tilt: 2.5, zoom: 2 });
		for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
		await expect(demo.readout).toContainText("pan 3° · tilt -5° · zoom 2.0×");
		expect(await outlineMiddle(demo.footprint)).toBeGreaterThan(level);
		await page.keyboard.press("ArrowLeft");
		await expect(demo.readout).toContainText("pan 0° · tilt -5° · zoom 2.0×");
		await expectCanvasShows(demo.canvas, { pan: 0, tilt: -5, zoom: 2 });
		// The keys turn the view, not the page.
		expect(await prevented(page, "ArrowUp")).toEqual([true]);
		expect(await prevented(page, "ArrowDown")).toEqual([true, true, true]);

		// On the crosshair the keys move the pointed pixel only.
		await demo.cross.focus();
		const place = await pointed(demo.readout);
		await page.keyboard.press("ArrowLeft");
		await expect
			.poll(async () => (await pointed(demo.readout)).x)
			.toBe(place.x - 36);
		await expect(demo.readout).toContainText("pan 0° · tilt -5° · zoom 2.0×");
	});

	test("after a click on the view the arrow keys turn it", async ({ page }) => {
		const demo = await openLiveDemo(page);
		const at = await grabPoint(demo);

		await page.mouse.click(at.x, at.y);
		// The frame has the focus, not the crosshair that came under the pointer.
		await expect(demo.view).toBeFocused();
		// A press of the mouse shows no ring of the keyboard focus.
		expect(await ringShown(demo.view)).toBe(false);
		const place = await pointed(demo.readout);
		expect(Math.abs(place.x - VIEW_SIZE * 0.3)).toBeLessThanOrEqual(2);

		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("pan 5° · tilt 0°");
		expect(await pointed(demo.readout)).toEqual(place);
		// The ring comes with the first key.
		expect(await ringShown(demo.view)).toBe(true);
	});

	test("after a drag the arrow keys turn the view", async ({ page }) => {
		const demo = await openLiveDemo(page);
		const from = await grabPoint(demo);

		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		// The press gives the frame the focus, before the pointer moves.
		await expect(demo.view).toBeFocused();
		await page.mouse.move(from.x + 40, from.y + 20, { steps: 8 });
		await page.mouse.up();
		await expect(demo.view).not.toHaveAttribute("data-grabbing");
		await expect(demo.view).toBeFocused();
		expect(await ringShown(demo.view)).toBe(false);
		const dragged = await shownView(demo.readout);
		expect(dragged.pan).toBeLessThanOrEqual(-18);
		const place = await pointed(demo.readout);

		// The readout rounds its angles; five whole degrees stay five.
		await page.keyboard.press("ArrowRight");
		await expect
			.poll(() => shownView(demo.readout))
			.toEqual({ ...dragged, pan: dragged.pan + 5 });
		expect(await pointed(demo.readout)).toEqual(place);
	});

	test("the Tab key goes from the view to the crosshair, whose keys move the pointed pixel", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);
		const at = await grabPoint(demo);

		await page.mouse.click(at.x, at.y);
		await expect(demo.view).toBeFocused();
		await page.keyboard.press("Tab");
		await expect(demo.cross).toBeFocused();
		const place = await pointed(demo.readout);
		await page.keyboard.press("ArrowRight");
		await expect
			.poll(() => pointed(demo.readout))
			.toEqual({ ...place, x: place.x + 36 });
		// The key never reaches the frame.
		await expect(demo.readout).toContainText("pan 0° · tilt 0°");
		await expect(demo.cross).toBeFocused();
	});

	test("a redraw that fails in a drag leaves the focus on the crosshair", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);
		const from = await grabPoint(demo);

		await expectCanvasShows(demo.canvas, INITIAL_VIEW);
		await breakRedraw(page);
		await page.mouse.move(from.x, from.y);
		await page.mouse.down();
		await expect(demo.view).toBeFocused();
		await page.mouse.move(from.x + 40, from.y + 20, { steps: 8 });
		// The frame had the focus and has left the tab order.
		await expectFallenBack(demo);
		await page.mouse.up();
		await expect(demo.cross).toBeFocused();
	});

	test.describe("on a touch screen", () => {
		test.use({ hasTouch: true });

		test("after a finger drags the view the arrow keys turn it", async ({
			page,
		}) => {
			const demo = await openLiveDemo(page);
			const from = await grabPoint(demo);

			// A finger that moves sends no mouse event, which is what gives a
			// pressed element the focus.
			const session = await page.context().newCDPSession(page);
			const touch = (type: string, points: { x: number; y: number }[]) =>
				session.send("Input.dispatchTouchEvent", {
					type: type as "touchStart" | "touchMove" | "touchEnd",
					touchPoints: points,
				});
			await touch("touchStart", [from]);
			for (let i = 1; i <= 8; i++)
				await touch("touchMove", [{ x: from.x + i * 5, y: from.y }]);
			await touch("touchEnd", []);
			await expect
				.poll(async () => (await shownView(demo.readout)).pan)
				.toBeLessThanOrEqual(-8);
			await expect(demo.view).not.toHaveAttribute("data-grabbing");
			await expect(demo.view).toBeFocused();
			expect(await ringShown(demo.view)).toBe(false);

			const dragged = await shownView(demo.readout);
			await page.keyboard.press("ArrowRight");
			await expect
				.poll(() => shownView(demo.readout))
				.toEqual({ ...dragged, pan: dragged.pan + 5 });
			// The ring comes with the first key and goes with the focus.
			expect(await ringShown(demo.view)).toBe(true);
			await page.keyboard.press("Tab");
			await expect(demo.cross).toBeFocused();
			expect(await ringShown(demo.view)).toBe(false);
		});
	});

	test("a pixel that reads nothing has no dot and no link", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);

		await demo.cross.focus();
		for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("펴진 화면 (720, 360)");
		await expect(demo.dot).toBeVisible();

		// The right edge of the view leaves the photo before 75° of pan.
		await demo.view.focus();
		let presses = 0;
		while (
			!((await demo.readout.textContent()) ?? "").includes("원본 사진 밖")
		) {
			expect(presses).toBeLessThan(15);
			await page.keyboard.press("ArrowRight");
			presses++;
		}
		await expect(demo.dot).toBeHidden();
		// A line is hidden by display: its box may be empty when it is shown.
		for (const mark of [demo.dot, demo.link, demo.linkHalo])
			await expect(mark).toHaveCSS("display", "none");

		for (let i = 0; i < presses; i++) await page.keyboard.press("ArrowLeft");
		await expect(demo.readout).toContainText("펴진 화면 (720, 360) → 원본 (");
		await expect(demo.dot).toBeVisible();
		for (const mark of [demo.dot, demo.link, demo.linkHalo])
			await expect(mark).not.toHaveCSS("display", "none");
	});

	test("after going back the slider agrees with the view", async ({ page }) => {
		const demo = await openLiveDemo(page);

		await demo.slider.locator("input").focus();
		await page.keyboard.press("End");
		await expect(demo.readout).toContainText("zoom 4.0×");

		// The browser gives the slider back the value it had; the view starts over.
		await page.goto("/ko/blog/");
		await page.goBack();
		await demo.host.scrollIntoViewIfNeeded();
		await expect(demo.root).toHaveAttribute("data-gpu", "on");
		await expect(demo.readout).toContainText("zoom 1.0×");
		expect(await demo.slider.evaluate((slider: GhSlider) => slider.value)).toBe(
			1,
		);
	});

	test("a demo whose pictures fail gives its WebGPU device back", async ({
		page,
	}) => {
		// The devices fisheye.js was given, and how many of them it destroyed.
		await page.addInitScript(() => {
			window.__devices = { made: 0, lost: 0 };
			if (!("GPUAdapter" in window)) return;
			const request = GPUAdapter.prototype.requestDevice;
			GPUAdapter.prototype.requestDevice = async function (...args) {
				const device = await request.apply(this, args);
				window.__devices.made++;
				void device.lost.then(() => window.__devices.lost++);
				return device;
			};
		});
		// The two pictures of the demo fail; the photo that fisheye.js is given
		// is fetched, so the view is drawn after the demo has been given up.
		await page.route(/\/_astro\/(?:cam1|dewarped)\.[^/]+\.jpg$/, (route) =>
			route.request().resourceType() === "image"
				? route.abort()
				: route.continue(),
		);
		await page.goto(POST);
		const hasAdapter = await page.evaluate(async () =>
			Boolean(await navigator.gpu?.requestAdapter()),
		);
		test.skip(!hasAdapter, "this browser gives no WebGPU adapter");
		const host = page.locator("demo-fisheye-inverse");
		await host.scrollIntoViewIfNeeded();

		await expect(host).toHaveAttribute("data-demo-state", "failed");
		await expect(host.locator("[data-demo-stage]")).toHaveCount(0);
		await expect
			.poll(() => page.evaluate(() => window.__devices))
			.toEqual({ made: 1, lost: 1 });
	});

	test("a failed redraw puts the still image back", async ({ page }) => {
		const demo = await openLiveDemo(page);

		await demo.view.focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("pan 5°");
		// No redraw is on its way when the frames are taken away: the one that
		// fails is that of the next key.
		await expectCanvasShows(demo.canvas, { pan: 5, tilt: 0, zoom: 1 });
		await breakRedraw(page);
		await page.keyboard.press("ArrowRight");
		await expectFallenBack(demo);

		// Pointing still works.
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("펴진 화면 (396, 360)");
	});

	test("a redraw that fails from the slider keeps the focus in the demo", async ({
		page,
	}) => {
		const demo = await openLiveDemo(page);

		await demo.slider.locator("input").focus();
		await page.keyboard.press("ArrowRight");
		await expect(demo.readout).toContainText("zoom 1.1×");
		await expectCanvasShows(demo.canvas, { pan: 0, tilt: 0, zoom: 1.1 });
		await breakRedraw(page);
		await page.keyboard.press("ArrowRight");
		await expectFallenBack(demo);
		// The key that failed went to the slider, not to the crosshair.
		await expect(demo.readout).toContainText("펴진 화면 (360, 360)");
	});
});
