import { animate } from "motion";

export interface CardStackOptions {
	reducedMotion: boolean;
}

const q = <T extends HTMLElement>(root: ParentNode, selector: string) =>
	root.querySelector<T>(selector);
const qa = <T extends HTMLElement>(root: ParentNode, selector: string) => [
	...root.querySelectorAll<T>(selector),
];

/**
 * Fired on a card whenever the scroll position of its step changes. Only cards
 * holding a `[data-step-progress]` element get it. Read the value with `stepProgress`.
 */
export const STEP_PROGRESS = "stepprogress";

/** How far the step of a card has scrolled through the viewport, from 0 to 1. */
export function stepProgress(card: HTMLElement): number {
	return Number(card.dataset.stepProgress ?? 0);
}

/**
 * Scroll showcase: the step list on one side, a stack of screens on the other.
 * The step in the middle of the viewport brings its screen to the front.
 * With reduced motion the screens swap and the page jumps without any animation.
 */
export function initCardStack(
	root: HTMLElement,
	options: CardStackOptions,
): void {
	const { reducedMotion } = options;
	const steps = qa(root, "[data-step]");
	const cards = qa(root, "[data-card]");
	const count = Math.min(steps.length, cards.length);
	if (count === 0) return;

	const url = q(root, "[data-url]");
	const title = q(root, "[data-title]");
	const counter = q(root, "[data-counter]");
	const progress = q(document, "[data-progress]");

	let active = -1;
	// While a button-driven scroll is running, passing steps must not flip screens.
	let programmatic = false;
	let programmaticTimer: number | undefined;

	function show(index: number) {
		if (index === active) return;
		const previous = active;
		active = index;
		cards.forEach((card, i) => {
			const on = i === index;
			card.dataset.state = on ? "front" : "back";
			card.toggleAttribute("inert", !on);
			if (reducedMotion || previous === -1) {
				card.style.opacity = on ? "1" : "0";
				card.style.transform = on ? "none" : "scale(0.97)";
			} else if (on) {
				animate(
					card,
					{ opacity: 1, transform: "scale(1) translateY(0px)" },
					{ type: "spring", visualDuration: 0.4, bounce: 0.15 },
				);
			} else if (i === previous) {
				animate(
					card,
					{ opacity: 0, transform: "scale(0.97) translateY(-12px)" },
					{ duration: 0.2, ease: "easeOut" },
				);
			}
		});
		steps.forEach((step, i) => {
			step.toggleAttribute("data-active", i === index);
		});
		// A recorded screen plays only while its card is in front.
		cards.forEach((card, i) => {
			const video = card.querySelector<HTMLVideoElement>("[data-card-video]");
			if (!video) return;
			if (i !== index) video.pause();
			else if (reducedMotion) video.controls = true;
			else
				video.play().catch(() => {
					video.controls = true;
				});
		});
		const card = cards[index];
		if (url) url.textContent = card.dataset.cardUrl ?? "";
		if (title) title.textContent = card.dataset.cardTitle ?? "";
		if (counter) counter.textContent = `${index + 1} / ${count}`;
	}

	function go(index: number) {
		const target = (index + count) % count;
		show(target);
		programmatic = true;
		clearTimeout(programmaticTimer);
		const release = () => {
			programmatic = false;
			clearTimeout(programmaticTimer);
			window.removeEventListener("scrollend", release);
		};
		// scrollend is the real signal. The timer only covers browsers without it,
		// and is long enough for a smooth scroll across the whole list.
		window.addEventListener("scrollend", release, { once: true });
		programmaticTimer = window.setTimeout(release, 4000);
		const startY = window.scrollY;
		steps[target].scrollIntoView({
			behavior: reducedMotion ? "auto" : "smooth",
			block: "center",
		});
		// Already centered: no scroll happens, so scrollend never fires.
		requestAnimationFrame(() => {
			if (window.scrollY === startY && !reducedMotion) {
				requestAnimationFrame(() => {
					if (window.scrollY === startY) release();
				});
			}
		});
	}

	q(root, "[data-prev]")?.addEventListener("click", () => go(active - 1));
	q(root, "[data-next]")?.addEventListener("click", () => go(active + 1));

	if (typeof IntersectionObserver !== "undefined") {
		const observer = new IntersectionObserver(
			(entries) => {
				if (programmatic) return;
				for (const entry of entries)
					if (entry.isIntersecting)
						show(steps.indexOf(entry.target as HTMLElement));
			},
			{ rootMargin: "-45% 0px -45% 0px" },
		);
		for (const step of steps) observer.observe(step);
	}

	// The progress bar and the panels that asked for it follow the scroll position.
	const tracked = cards
		.slice(0, count)
		.map((card, i) => ({ card, step: steps[i] }))
		.filter(({ card }) => card.querySelector("[data-step-progress]"));
	let frame = 0;
	function onScroll() {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			const doc = document.documentElement;
			const vh = window.innerHeight || 800;
			if (progress) {
				const max = Math.max(1, doc.scrollHeight - vh);
				progress.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max))})`;
			}
			for (const { card, step } of tracked) {
				const rect = step.getBoundingClientRect();
				const w = Math.min(
					1,
					Math.max(0, (vh * 0.7 - rect.top) / (rect.height * 0.9)),
				);
				card.dataset.stepProgress = String(w);
				card.dispatchEvent(new CustomEvent(STEP_PROGRESS));
			}
		});
	}
	window.addEventListener("scroll", onScroll, { passive: true });

	root.dataset.ready = "";
	show(0);
	onScroll();
}
