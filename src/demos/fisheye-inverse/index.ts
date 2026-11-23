import type { GhSlider } from "@ghds/web-components/slider";
import photoUrl from "../../assets/home/cam1.jpg?url";
import type { DemoContext } from "../types";
import { createDewarper, type Dewarper } from "./dewarp";
import stillUrl from "./dewarped.jpg?url";
import {
	CAM1,
	clampView,
	dragView,
	footprint,
	footprintPath,
	INITIAL_VIEW,
	type Point,
	scaleLens,
	sourcePoint,
	squareOutput,
	turnView,
	type View,
} from "./mapping";
import { readout, strings } from "./strings";
import css from "./style.css?inline";

// Astro puts CSS that a page script imports on every page with that script,
// also when the import is behind import(). The sheet travels in this chunk
// instead, so that posts without the demo do not receive it.
const style = document.createElement("style");
style.textContent = css;
document.head.append(style);

/** The side of cam1.jpg, in pixels. */
const PHOTO_SIZE = 1024;
/** The side of the dewarped view, in output pixels. */
const VIEW_SIZE = 720;
const POINTS_PER_EDGE = 24;
/** The radius of the dot on the photo, in photo pixels. */
const DOT_RADIUS = 10;
/** How far an arrow key moves the pointed pixel, and with Shift. */
const STEP = 36;
const FINE_STEP = 6;
/** How many degrees an arrow key turns the view at zoom 1. */
const VIEW_STEP = 5;

const LENS = scaleLens(CAM1, PHOTO_SIZE / CAM1.width);
const OUTPUT = squareOutput(LENS, VIEW_SIZE);

/** Where an arrow key points on the screen: x to the right, y down. */
const ARROWS: Record<string, readonly [number, number]> = {
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	ArrowUp: [0, -1],
	ArrowDown: [0, 1],
};

interface State {
	view: View;
	/** In output pixels. */
	pointed: Point;
}

// The overlay is in photo pixels. The link joins the two panes, so it is in
// CSS pixels of .fi-panes.
const TEMPLATE = `
<div class="fi">
	<div class="fi-panes">
		<figure class="fi-pane" data-pane="source">
			<figcaption></figcaption>
			<div class="fi-frame">
				<img class="fi-photo" alt="" width="${PHOTO_SIZE}" height="${PHOTO_SIZE}">
				<svg class="fi-overlay" viewBox="0 0 ${PHOTO_SIZE} ${PHOTO_SIZE}" aria-hidden="true">
					<path class="fi-footprint-halo"></path>
					<path class="fi-footprint" data-testid="fi-footprint"></path>
					<circle class="fi-dot" data-testid="fi-dot" r="${DOT_RADIUS}"></circle>
				</svg>
			</div>
		</figure>
		<figure class="fi-pane" data-pane="view">
			<figcaption></figcaption>
			<div class="fi-frame" data-testid="fi-view">
				<img class="fi-still" alt="" width="${VIEW_SIZE}" height="${VIEW_SIZE}">
				<button type="button" class="fi-cross" data-testid="fi-cross"></button>
			</div>
		</figure>
		<svg class="fi-link" aria-hidden="true">
			<line class="fi-link-halo" data-testid="fi-link-halo"></line>
			<line data-testid="fi-link"></line>
		</svg>
	</div>
	<p class="fi-hint" data-testid="fi-hint"></p>
	<p class="fi-notice" data-testid="fi-notice" hidden></p>
	<gh-slider min="1" max="4" step="0.1" value="1" disabled></gh-slider>
	<p class="fi-readout" data-testid="fi-readout"></p>
	<p class="fi-status" data-testid="fi-status" aria-live="polite"></p>
</div>`;

function find<T extends Element>(root: ParentNode, selector: string): T {
	const element = root.querySelector<T>(selector);
	if (!element) throw new Error(`fisheye-inverse: ${selector} is missing`);
	return element;
}

function clampToView(value: number): number {
	return Math.min(VIEW_SIZE, Math.max(0, value));
}

export async function mount(
	stage: HTMLElement,
	{ locale }: DemoContext,
): Promise<void> {
	const copy = strings(locale);
	stage.innerHTML = TEMPLATE;
	find(stage, '[data-pane="source"] figcaption').textContent = copy.source;
	find(stage, '[data-pane="view"] figcaption').textContent = copy.view;
	const photo = find<HTMLImageElement>(stage, ".fi-photo");
	photo.alt = copy.photoAlt;
	photo.src = photoUrl;

	const root = find<HTMLElement>(stage, ".fi");
	const panes = find<HTMLElement>(stage, ".fi-panes");
	const sourceFrame = find<HTMLElement>(
		stage,
		'[data-pane="source"] .fi-frame',
	);
	const viewFrame = find<HTMLElement>(stage, '[data-pane="view"] .fi-frame');
	const outlines = [
		find<SVGPathElement>(stage, ".fi-footprint-halo"),
		find<SVGPathElement>(stage, ".fi-footprint"),
	];
	const dot = find<SVGCircleElement>(stage, ".fi-dot");
	const cross = find<HTMLButtonElement>(stage, ".fi-cross");
	const link = find<SVGLineElement>(stage, '[data-testid="fi-link"]');
	const linkHalo = find<SVGLineElement>(stage, ".fi-link-halo");
	const text = find<HTMLElement>(stage, ".fi-readout");
	const status = find<HTMLElement>(stage, ".fi-status");
	const hint = find<HTMLElement>(stage, ".fi-hint");
	const notice = find<HTMLElement>(stage, ".fi-notice");
	const slider = find<GhSlider>(stage, "gh-slider");
	const still = find<HTMLImageElement>(stage, ".fi-still");
	still.alt = copy.viewAlt;
	still.src = stillUrl;
	hint.textContent = copy.hint;
	cross.setAttribute("aria-label", copy.crossLabel);
	slider.setAttribute("label", copy.zoom);
	// Takes the place of the still image while fisheye.js draws the view.
	const canvas = document.createElement("canvas");
	canvas.className = "fi-canvas";
	canvas.width = VIEW_SIZE;
	canvas.height = VIEW_SIZE;
	canvas.setAttribute("role", "img");
	canvas.setAttribute("aria-label", copy.viewAlt);

	const state: State = {
		view: INITIAL_VIEW,
		pointed: { x: VIEW_SIZE / 2, y: VIEW_SIZE / 2 },
	};
	/** The source pixel that the pointed pixel reads. */
	let source: Point | null = null;
	/** Draws the view; the view can change only while there is one. */
	let dewarper: Dewarper | null = null;
	/** The pointer that drags the view, and where it was last. */
	let grab: { id: number; x: number; y: number } | null = null;
	/** The pictures cannot be shown, and the loader removes the stage. */
	let abandoned = false;

	function drawFootprint() {
		const path = footprintPath(
			footprint(LENS, state.view, OUTPUT, POINTS_PER_EDGE),
		);
		for (const outline of outlines) outline.setAttribute("d", path);
	}

	/** The link depends on where the panes are, so it is placed again when they move. */
	function placeLink() {
		if (!source) return;
		const origin = panes.getBoundingClientRect();
		const from = viewFrame.getBoundingClientRect();
		const to = sourceFrame.getBoundingClientRect();
		const { pointed } = state;
		const ends = {
			x1: from.left - origin.left + (pointed.x / VIEW_SIZE) * from.width,
			y1: from.top - origin.top + (pointed.y / VIEW_SIZE) * from.height,
			x2: to.left - origin.left + (source.x / PHOTO_SIZE) * to.width,
			y2: to.top - origin.top + (source.y / PHOTO_SIZE) * to.height,
		};
		for (const [name, value] of Object.entries(ends))
			link.setAttribute(name, value.toFixed(2));
		// The halo is painted over the photo and its overlay, so it stops at
		// the edge of the dot.
		const length = Math.hypot(ends.x2 - ends.x1, ends.y2 - ends.y1);
		const cut =
			length > 0
				? Math.min(1, ((DOT_RADIUS / PHOTO_SIZE) * to.width) / length)
				: 0;
		const haloEnds = {
			...ends,
			x2: ends.x2 - (ends.x2 - ends.x1) * cut,
			y2: ends.y2 - (ends.y2 - ends.y1) * cut,
		};
		for (const [name, value] of Object.entries(haloEnds))
			linkHalo.setAttribute(name, value.toFixed(2));
	}

	function drawPointed() {
		const { view, pointed } = state;
		source = sourcePoint(LENS, view, OUTPUT, pointed.x, pointed.y);
		cross.style.left = `${(pointed.x / VIEW_SIZE) * 100}%`;
		cross.style.top = `${(pointed.y / VIEW_SIZE) * 100}%`;
		for (const mark of [dot, link, linkHalo])
			mark.toggleAttribute("hidden", source === null);
		if (source) {
			dot.setAttribute("cx", source.x.toFixed(2));
			dot.setAttribute("cy", source.y.toFixed(2));
		}
		placeLink();
		const line = readout(locale, view, pointed, source);
		if (text.textContent !== line) text.textContent = line;
	}

	/**
	 * Reads the readout to a screen reader. Only the keys of the demo call
	 * this: a pointer changes the readout on every move, and the slider
	 * announces its own value.
	 */
	function announce() {
		status.textContent = text.textContent;
	}

	function point(x: number, y: number) {
		state.pointed = { x: clampToView(x), y: clampToView(y) };
		drawPointed();
	}

	function setView(view: View) {
		state.view = clampView(view);
		drawFootprint();
		drawPointed();
		dewarper?.render(state.view);
	}

	/** Ends the grab. Another pointer that leaves the view does not end it. */
	function release(event?: Event) {
		if (grab && event instanceof PointerEvent && event.pointerId !== grab.id)
			return;
		grab = null;
		viewFrame.removeAttribute("data-grabbing");
	}

	/** Nothing of the demo keeps running, now or when WebGPU answers later. */
	function abandon() {
		abandoned = true;
		dewarper?.destroy();
		dewarper = null;
	}

	function gpuOn(created: Dewarper) {
		if (abandoned) {
			created.destroy();
			return;
		}
		dewarper = created;
		still.replaceWith(canvas);
		viewFrame.tabIndex = 0;
		viewFrame.setAttribute("role", "group");
		viewFrame.setAttribute("aria-label", copy.viewLabel);
		slider.toggleAttribute("disabled", false);
		// After a history navigation the browser gives the slider the value it
		// had on the page that was left; the view starts over.
		slider.value = state.view.zoom;
		// The style sheet shows the hint from here on.
		root.dataset.gpu = "on";
	}

	/** The view goes back to the still image; pointing at it stays. */
	function gpuOff(error?: unknown) {
		if (abandoned) return;
		if (error !== undefined)
			console.warn("fisheye-inverse: showing the still image.", error);
		dewarper?.destroy();
		dewarper = null;
		release();
		setView(INITIAL_VIEW);
		canvas.replaceWith(still);
		// The frame is about to leave the tab order and the slider to be
		// disabled; the slider is the active element while its input has focus.
		if (
			document.activeElement === viewFrame ||
			document.activeElement === slider
		)
			cross.focus();
		for (const name of ["tabindex", "role", "aria-label"])
			viewFrame.removeAttribute(name);
		slider.toggleAttribute("disabled", true);
		slider.value = INITIAL_VIEW.zoom;
		hint.hidden = true;
		notice.textContent = copy.noGpu;
		notice.hidden = false;
		root.dataset.gpu = "off";
	}

	/** The output pixel under the pointer, or null while the view has no size. */
	function pixelUnder(event: PointerEvent): Point | null {
		const box = viewFrame.getBoundingClientRect();
		if (box.width === 0 || box.height === 0) return null;
		return {
			x: clampToView(((event.clientX - box.left) / box.width) * VIEW_SIZE),
			y: clampToView(((event.clientY - box.top) / box.height) * VIEW_SIZE),
		};
	}
	// The pointed pixel stays where the pointer left the view.
	viewFrame.addEventListener("pointerdown", (event) => {
		const pixel = pixelUnder(event);
		// While one pointer drags the view, the others do nothing.
		if (!pixel || grab) return;
		point(pixel.x, pixel.y);
		if (!dewarper || !event.isPrimary || event.button !== 0) return;
		grab = { id: event.pointerId, x: event.clientX, y: event.clientY };
		viewFrame.setPointerCapture(event.pointerId);
		viewFrame.toggleAttribute("data-grabbing", true);
	});
	viewFrame.addEventListener("pointermove", (event) => {
		const pixel = pixelUnder(event);
		if (!pixel) return;
		if (grab?.id !== event.pointerId) {
			if (!grab) point(pixel.x, pixel.y);
			return;
		}
		// A press of the mouse has given the frame the focus, and its arrow
		// keys turn the view. A finger that drags sends no mouse event, so the
		// focus is moved here, without the ring of the keyboard focus.
		if (document.activeElement !== viewFrame)
			viewFrame.focus({ preventScroll: true, focusVisible: false });
		// The pointed pixel goes with the pointer, and the picture with the
		// grab: dragView() counts in output pixels.
		const scale = VIEW_SIZE / viewFrame.getBoundingClientRect().width;
		state.pointed = pixel;
		setView(
			dragView(
				state.view,
				(event.clientX - grab.x) * scale,
				(event.clientY - grab.y) * scale,
			),
		);
		grab.x = event.clientX;
		grab.y = event.clientY;
	});
	for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
		viewFrame.addEventListener(type, release);

	viewFrame.addEventListener("keydown", (event) => {
		const direction = ARROWS[event.key];
		if (!dewarper || !direction) return;
		if (event.altKey || event.ctrlKey || event.metaKey) return;
		event.preventDefault();
		// The focus that a dragging finger gave has no ring. The style sheet
		// draws it from the first key on, until the focus leaves the frame.
		viewFrame.toggleAttribute("data-keyboard", true);
		setView(turnView(state.view, direction, VIEW_STEP));
		announce();
	});
	viewFrame.addEventListener("blur", () =>
		viewFrame.removeAttribute("data-keyboard"),
	);

	// gh-slider sends two input events for every value; the second one changes nothing.
	slider.addEventListener("input", () => {
		const zoom = Number(slider.value);
		if (!dewarper || zoom === state.view.zoom) return;
		setView({ ...state.view, zoom });
	});

	cross.addEventListener("keydown", (event) => {
		const direction = ARROWS[event.key];
		if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
		// The arrow keys would scroll the page, and on the frame they turn the view.
		event.preventDefault();
		event.stopPropagation();
		const step = event.shiftKey ? FINE_STEP : STEP;
		point(
			state.pointed.x + direction[0] * step,
			state.pointed.y + direction[1] * step,
		);
		announce();
	});

	drawFootprint();
	drawPointed();
	new ResizeObserver(placeLink).observe(panes);

	// The demo is ready without the answer: until it comes the view is the still image.
	if ("gpu" in navigator && navigator.gpu)
		createDewarper(canvas, photoUrl, LENS, OUTPUT, gpuOff).then(gpuOn, gpuOff);
	else gpuOff();

	// The demo is ready when both pictures can be painted. Until then, and
	// when one of them cannot be loaded, the fallback of the post stays.
	try {
		await Promise.all([photo.decode(), still.decode()]);
	} catch (error) {
		abandon();
		throw error;
	}
}
