import type { GhSlider } from "@ghds/web-components/slider";
import { animate } from "motion";
import { arrowTurn } from "./fisheye-keys";

type Mode = "ptz" | "equirectangular" | "cylindrical" | "pane" | "original";
type Cam = "cam1" | "cam2";
type FisheyeInstance = import("@gyeonghokim/fisheye.js").Fisheye;

const root = document.querySelector<HTMLElement>("[data-fisheye-demo]");
if (root) setup(root);

function setup(root: HTMLElement) {
	const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const hasGpu = "gpu" in navigator && Boolean(navigator.gpu);
	const deck = initDeck(root, reduceMotion, hasGpu);
	if (hasGpu) void initLive(root, deck);
}

// Deck: two cards stacked, the front one flat, the other peeking out bottom-right.
function initDeck(root: HTMLElement, reduceMotion: boolean, hasGpu: boolean) {
	const cards = new Map(
		[...root.querySelectorAll<HTMLElement>("[data-deck-card]")].map((el) => [
			el.dataset.deckCard as string,
			el,
		]),
	);
	const tabs = [...root.querySelectorAll<HTMLElement>("[data-deck-tab]")];
	const FRONT = { x: 0, y: 0, rotate: 0, scale: 1 };
	const BACK = { x: 28, y: 22, rotate: 3, scale: 0.94 };
	const place = (el: HTMLElement, p: typeof FRONT) => {
		el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotate}deg) scale(${p.scale})`;
	};

	let front = hasGpu ? "live" : "product";
	let zTimer: number | undefined;

	const video = root.querySelector<HTMLVideoElement>("[data-product-video]");
	const toggle = root.querySelector<HTMLElement>("[data-product-toggle]");
	if (video && toggle) {
		const label = () => {
			toggle.textContent =
				(video.paused ? toggle.dataset.play : toggle.dataset.pause) ?? "";
		};
		video.addEventListener("play", label);
		video.addEventListener("pause", label);
		toggle.addEventListener("click", () => {
			if (video.paused) void video.play().catch(() => {});
			else video.pause();
		});
		label();
	}
	// The recording restarts whenever its card comes to the front.
	function syncVideo() {
		if (!video) return;
		if (front !== "product") {
			video.pause();
			return;
		}
		if (reduceMotion) {
			video.controls = true;
			return;
		}
		video.currentTime = 0;
		video.play().catch(() => {
			video.controls = true;
		});
	}

	function apply(previous: string | null) {
		for (const [id, el] of cards) {
			const isFront = id === front;
			el.querySelector<HTMLElement>("gh-card")?.toggleAttribute(
				"inert",
				!isFront,
			);
			el.querySelector<HTMLElement>("[data-bring]")?.toggleAttribute(
				"hidden",
				isFront,
			);
			if (previous === null || reduceMotion) {
				el.dataset.state = isFront ? "front" : "back";
				place(el, isFront ? FRONT : BACK);
			} else if (id === previous) {
				animate(
					el,
					{
						x: [0, -220, BACK.x],
						y: [0, -28, BACK.y],
						rotate: [0, -10, BACK.rotate],
						scale: [1, 0.97, BACK.scale],
					},
					{ duration: 0.6, ease: "easeInOut" },
				);
			} else {
				animate(el, FRONT, {
					type: "spring",
					stiffness: 260,
					damping: 24,
					delay: 0.12,
				});
			}
		}
		for (const tab of tabs) {
			const on = tab.dataset.deckTab === front;
			tab.setAttribute("variant", on ? "primary" : "neutral");
			tab.setAttribute("aria-pressed", String(on));
		}
		syncVideo();
	}

	function bringToFront(id: string) {
		if (front === id) return;
		const previous = front;
		front = id;
		apply(previous);
		// Swap stacking order halfway so the old card tucks behind.
		clearTimeout(zTimer);
		zTimer = window.setTimeout(
			() => {
				for (const [cardId, el] of cards)
					el.dataset.state = cardId === front ? "front" : "back";
			},
			reduceMotion ? 0 : 260,
		);
	}

	for (const tab of tabs)
		tab.addEventListener("click", () =>
			bringToFront(tab.dataset.deckTab ?? ""),
		);
	for (const button of root.querySelectorAll<HTMLElement>("[data-bring]"))
		button.addEventListener("click", () =>
			bringToFront(button.dataset.bring ?? ""),
		);
	apply(null);
	return { bringToFront, isFront: (id: string) => front === id };
}

// Calibration from the fisheye.js example (test_cases.json), measured on 3264x3264 frames.
function calibration(cam: Cam) {
	const d =
		cam === "cam2"
			? { k1: 0.02494321, k2: 0.0049985, k3: -0.01754164, k4: 0.00455207 }
			: { k1: 0.03562009, k2: -0.02587979, k3: 0.00564249, k4: -0.00107043 };
	return { ...d, fx: 991, fy: 991, cx: 1612, cy: 1617 };
}

async function initLive(root: HTMLElement, deck: ReturnType<typeof initDeck>) {
	const els = {
		canvas: root.querySelector<HTMLCanvasElement>("[data-canvas]"),
		status: root.querySelector<HTMLElement>("[data-status]"),
		hint: root.querySelector<HTMLElement>("[data-hint-text]"),
		zoomRow: root.querySelector<HTMLElement>("[data-zoom-row]"),
		slider: root.querySelector<GhSlider>("gh-slider"),
		fallback: root.querySelector<HTMLElement>("[data-testid=fisheye-fallback]"),
		ctx: root
			.querySelector<HTMLCanvasElement>("[data-canvas]")
			?.getContext("2d"),
	};
	if (
		!els.canvas ||
		!els.status ||
		!els.hint ||
		!els.zoomRow ||
		!els.slider ||
		!els.fallback ||
		!els.ctx
	)
		return;
	const { canvas, status, hint, zoomRow, slider, fallback, ctx } = els as {
		[K in keyof typeof els]: NonNullable<(typeof els)[K]>;
	};

	const state = {
		mode: "ptz" as Mode,
		cam: "cam1" as Cam,
		pan: 0,
		tilt: 0,
		zoom: 1,
		dragged: false,
		ready: false,
	};
	const bitmaps = new Map<Cam, ImageBitmap>();
	let fisheye: FisheyeInstance | null = null;
	let FisheyeClass: typeof import("@gyeonghokim/fisheye.js").Fisheye;
	let needsRebuild = true;
	let busy = false;
	let pending = false;
	let failed = false;

	async function bitmapFor(cam: Cam) {
		const cached = bitmaps.get(cam);
		if (cached) return cached;
		const response = await fetch(root?.dataset[cam] ?? "");
		const bitmap = await createImageBitmap(await response.blob());
		bitmaps.set(cam, bitmap);
		return bitmap;
	}

	function options(w: number, h: number) {
		const cal = calibration(state.cam);
		const sx = w / 3264;
		const sy = h / 3264;
		const projection =
			state.mode === "ptz" || state.mode === "pane"
				? ({
						kind: "rectilinear",
						mode: "manual",
						newFx: cal.fx * sx,
						newFy: cal.fy * sy,
						newCx: w / 2,
						newCy: h / 2,
					} as const)
				: ({ kind: state.mode } as const);
		return {
			fx: cal.fx * sx,
			fy: cal.fy * sy,
			cx: cal.cx * sx,
			cy: cal.cy * sy,
			k1: cal.k1,
			k2: cal.k2,
			k3: cal.k3,
			k4: cal.k4,
			width: w,
			height: h,
			balance: 0,
			fovScale: 1,
			projection,
			...(state.mode === "ptz"
				? { ptz: { pan: state.pan, tilt: state.tilt, zoom: state.zoom } }
				: {}),
			...(state.mode === "pane" ? { pane: { kind: "4pane" as const } } : {}),
		};
	}

	function draw(result: VideoFrame | VideoFrame[]) {
		const frames = Array.isArray(result) ? result : [result];
		const W = canvas.width;
		const H = canvas.height;
		const ink = getComputedStyle(canvas).backgroundColor;
		ctx.fillStyle = ink;
		ctx.fillRect(0, 0, W, H);
		const cells =
			frames.length === 4
				? [
						[0, 0],
						[W / 2, 0],
						[0, H / 2],
						[W / 2, H / 2],
					].map(([x, y]) => [x, y, W / 2, H / 2] as const)
				: [[0, 0, W, H] as const];
		const cover = state.mode === "ptz" || state.mode === "pane";
		frames.forEach((frame, i) => {
			const cell = cells[i];
			if (!cell) return;
			const [cx, cy, cw, ch] = cell;
			const fw = frame.displayWidth;
			const fh = frame.displayHeight;
			const scale = cover
				? Math.max(cw / fw, ch / fh)
				: Math.min(cw / fw, ch / fh);
			ctx.save();
			ctx.beginPath();
			ctx.rect(cx, cy, cw, ch);
			ctx.clip();
			ctx.drawImage(
				frame,
				cx + (cw - fw * scale) / 2,
				cy + (ch - fh * scale) / 2,
				fw * scale,
				fh * scale,
			);
			ctx.restore();
		});
		if (frames.length === 4) {
			ctx.strokeStyle = getComputedStyle(root).getPropertyValue(
				"--sys-color-bg-canvas",
			);
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(W / 2, 0);
			ctx.lineTo(W / 2, H);
			ctx.moveTo(0, H / 2);
			ctx.lineTo(W, H / 2);
			ctx.stroke();
		}
		for (const frame of frames) frame.close();
	}

	function updateUi() {
		zoomRow?.toggleAttribute("hidden", state.mode !== "ptz");
		canvas?.toggleAttribute("data-grabbable", state.mode === "ptz");
		if (status)
			status.textContent =
				state.mode === "ptz"
					? `pan ${Math.round(state.pan)}° · tilt ${Math.round(state.tilt)}° · ${state.zoom.toFixed(1)}×`
					: `WebGPU · ${state.mode}`;
		const showHint = !state.ready || (state.mode === "ptz" && !state.dragged);
		if (hint) {
			hint.toggleAttribute("hidden", !showHint);
			hint.textContent = state.ready
				? (root?.dataset.hint ?? "")
				: (root?.dataset.loading ?? "");
		}
		for (const el of root?.querySelectorAll<HTMLElement>("[data-mode]") ?? []) {
			const on = el.dataset.mode === state.mode;
			el.setAttribute("variant", on ? "primary" : "neutral");
			el.setAttribute("aria-pressed", String(on));
		}
		for (const el of root?.querySelectorAll<HTMLElement>("[data-cam]") ?? [])
			el.setAttribute("aria-pressed", String(el.dataset.cam === state.cam));
	}

	function giveUp(error: unknown) {
		console.warn("[fisheye] falling back to the still photo", error);
		failed = true;
		fisheye?.destroy();
		fisheye = null;
		for (const el of root?.querySelectorAll<HTMLElement>("[data-live]") ?? [])
			el.hidden = true;
		fallback?.removeAttribute("hidden");
		if (deck.isFront("live")) deck.bringToFront("product");
		if (status) status.textContent = root?.dataset.statusFallback ?? "";
	}

	// One undistort in flight; changes that arrive meanwhile collapse into one follow-up run.
	async function render(rebuild: boolean) {
		if (rebuild) needsRebuild = true;
		if (busy) {
			pending = true;
			return;
		}
		busy = true;
		let input: VideoFrame | null = null;
		try {
			const bitmap = await bitmapFor(state.cam);
			const opts = options(bitmap.width, bitmap.height);
			if (!fisheye || needsRebuild) {
				fisheye?.destroy();
				fisheye = new FisheyeClass(opts);
				needsRebuild = false;
			} else {
				fisheye.updateConfig(opts);
			}
			input = new VideoFrame(bitmap, { timestamp: 0 });
			const result = await fisheye.undistort(input);
			input.close();
			input = null;
			draw(result);
			state.ready = true;
			updateUi();
		} catch (error) {
			input?.close();
			giveUp(error);
		} finally {
			busy = false;
			if (pending && !failed) {
				pending = false;
				void render(false);
			}
		}
	}

	try {
		({ Fisheye: FisheyeClass } = await import("@gyeonghokim/fisheye.js"));
	} catch (error) {
		giveUp(error);
		return;
	}

	for (const el of root.querySelectorAll<HTMLElement>("[data-live]"))
		el.hidden = false;
	zoomRow.hidden = false;
	fallback.hidden = true;
	updateUi();

	let drag: { x: number; y: number; pan: number; tilt: number } | null = null;
	canvas.addEventListener("pointerdown", (e) => {
		if (state.mode !== "ptz") return;
		drag = { x: e.clientX, y: e.clientY, pan: state.pan, tilt: state.tilt };
		canvas.setPointerCapture(e.pointerId);
		canvas.toggleAttribute("data-grabbing", true);
	});
	canvas.addEventListener("pointermove", (e) => {
		if (!drag) return;
		const k = 0.25 / state.zoom;
		let pan = drag.pan - (e.clientX - drag.x) * k;
		if (pan > 180) pan -= 360;
		if (pan < -180) pan += 360;
		state.pan = pan;
		state.tilt = Math.max(
			-90,
			Math.min(90, drag.tilt + (e.clientY - drag.y) * k),
		);
		state.dragged = true;
		updateUi();
		void render(false);
	});
	const release = () => {
		drag = null;
		canvas.removeAttribute("data-grabbing");
	};
	canvas.addEventListener("pointerup", release);
	canvas.addEventListener("pointercancel", release);
	canvas.addEventListener("keydown", (e) => {
		if (state.mode !== "ptz") return;
		const turned = arrowTurn(state, e.key);
		if (turned) {
			state.pan = turned.pan;
			state.tilt = turned.tilt;
		} else if (e.key === "+" || e.key === "=")
			state.zoom = Math.min(4, state.zoom + 0.2);
		else if (e.key === "-") state.zoom = Math.max(1, state.zoom - 0.2);
		else return;
		e.preventDefault();
		state.dragged = true;
		slider.value = state.zoom;
		updateUi();
		void render(false);
	});
	// gh-slider fires its own input event and the browser's composed one for every
	// tick; the second one carries the same value, so skip it.
	slider.addEventListener("input", () => {
		const zoom = Number(slider.value);
		if (zoom === state.zoom) return;
		state.zoom = zoom;
		updateUi();
		void render(false);
	});
	for (const el of root.querySelectorAll<HTMLElement>("[data-mode]"))
		el.addEventListener("click", () => {
			const mode = el.dataset.mode as Mode;
			if (mode === state.mode) return;
			state.mode = mode;
			updateUi();
			void render(true);
		});
	for (const el of root.querySelectorAll<HTMLElement>("[data-cam]"))
		el.addEventListener("click", () => {
			const cam = el.dataset.cam as Cam;
			if (cam === state.cam) return;
			state.cam = cam;
			updateUi();
			void render(true);
		});

	void render(true);
}
