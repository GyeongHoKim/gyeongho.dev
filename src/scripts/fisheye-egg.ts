import { animate } from "motion";

interface Egg {
	click(): boolean;
	escape(): boolean;
	readonly active: boolean;
}

/** Counts logo clicks: the threshold-th click turns it on, the next turns it off. */
export function createEgg(options: { threshold?: number } = {}): Egg {
	const threshold = options.threshold ?? 5;
	let count = 0;
	let active = false;
	return {
		click() {
			if (active) {
				active = false;
				count = 0;
				return false;
			}
			count += 1;
			if (count >= threshold) {
				active = true;
				count = 0;
			}
			return active;
		},
		escape() {
			active = false;
			count = 0;
			return false;
		},
		get active() {
			return active;
		},
	};
}

const NAVIGATE_DELAY = 400;
const TARGET_SCALE = 120;
const MAP_SIZE = 128;

/** Barrel displacement map: R/G encode x/y offset, 128 means no shift. */
function barrelMap(): string | null {
	const canvas = document.createElement("canvas");
	canvas.width = MAP_SIZE;
	canvas.height = MAP_SIZE;
	const ctx = canvas.getContext("2d");
	if (!ctx) return null;
	const image = ctx.createImageData(MAP_SIZE, MAP_SIZE);
	for (let y = 0; y < MAP_SIZE; y++) {
		for (let x = 0; x < MAP_SIZE; x++) {
			const nx = (x / (MAP_SIZE - 1)) * 2 - 1;
			const ny = (y / (MAP_SIZE - 1)) * 2 - 1;
			const r2 = (nx * nx + ny * ny) / 2;
			// Sample from points pulled toward the centre at the edges, so the
			// content bulges outwards in the middle like a fisheye lens.
			const k = r2;
			const dx = -nx * k;
			const dy = -ny * k;
			const i = (y * MAP_SIZE + x) * 4;
			image.data[i] = Math.round(128 + dx * 127);
			image.data[i + 1] = Math.round(128 + dy * 127);
			image.data[i + 2] = 128;
			image.data[i + 3] = 255;
		}
	}
	ctx.putImageData(image, 0, 0);
	return canvas.toDataURL("image/png");
}

export function initEgg(
	logo: HTMLElement,
	root: HTMLElement,
	options: { reducedMotion: boolean },
): void {
	if (options.reducedMotion) return;
	const feImage = document.querySelector<SVGElement>("#fisheye feImage");
	const displacement = document.querySelector<SVGElement>(
		"#fisheye feDisplacementMap",
	);
	if (!feImage || !displacement) return;

	const egg = createEgg();
	let timer: number | undefined;
	let animation: { stop(): void } | undefined;

	function setScale(value: number) {
		displacement?.setAttribute("scale", String(value));
	}

	function show(on: boolean) {
		animation?.stop();
		if (on) {
			if (!feImage?.getAttribute("href")) {
				const map = barrelMap();
				if (!map) return;
				feImage?.setAttribute("href", map);
			}
			setScale(0);
			root.setAttribute("data-fisheye", "");
			animation = animate(0, TARGET_SCALE, {
				duration: 1.2,
				ease: "easeOut",
				onUpdate: setScale,
			});
		} else {
			root.removeAttribute("data-fisheye");
			setScale(0);
		}
	}

	logo.addEventListener("click", (event) => {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey)
			return;
		event.preventDefault();
		window.clearTimeout(timer);
		const wasActive = egg.active;
		const active = egg.click();
		if (active !== wasActive) {
			show(active);
			return;
		}
		// Not a toggle: follow the link unless another click arrives in time.
		const href = (logo as HTMLAnchorElement).href;
		timer = window.setTimeout(() => {
			window.location.href = href;
		}, NAVIGATE_DELAY);
	});

	document.addEventListener("keydown", (event) => {
		if (event.key !== "Escape" || !egg.active) return;
		egg.escape();
		show(false);
	});
}
