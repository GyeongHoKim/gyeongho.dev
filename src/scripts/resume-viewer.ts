import type { GhToggle } from "@ghds/web-components/toggle";
import type { Locale } from "../i18n";
import { resumePdfPath } from "../lib/resume-path";

const renderTokens = new WeakMap<HTMLElement, number>();
const bumpToken = (container: HTMLElement) => {
	const token = (renderTokens.get(container) ?? 0) + 1;
	renderTokens.set(container, token);
	return token;
};

/**
 * Draws every page of the PDF at url into container as a <canvas>. A newer call
 * for the same container supersedes an older one, so quick language switches
 * never mix pages.
 */
export async function renderPdf(
	container: HTMLElement,
	url: string,
): Promise<void> {
	const token = bumpToken(container);
	const stale = () => renderTokens.get(container) !== token;
	const [pdfjs, worker] = await Promise.all([
		import("pdfjs-dist"),
		import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
	]);
	pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
	const task = pdfjs.getDocument({ url });
	try {
		const pdf = await task.promise;
		const width = container.clientWidth;
		const outputScale = window.devicePixelRatio || 1;
		for (let number = 1; number <= pdf.numPages; number++) {
			const page = await pdf.getPage(number);
			if (stale()) return;
			const base = page.getViewport({ scale: 1 });
			const viewport = page.getViewport({
				scale: width > 0 ? width / base.width : 1,
			});
			const canvas = document.createElement("canvas");
			canvas.width = Math.floor(viewport.width * outputScale);
			canvas.height = Math.floor(viewport.height * outputScale);
			canvas.setAttribute("aria-hidden", "true");
			const canvasContext = canvas.getContext("2d");
			if (canvasContext === null) throw new Error("2D canvas unavailable");
			await page.render({
				canvas,
				canvasContext,
				viewport,
				transform:
					outputScale === 1
						? undefined
						: [outputScale, 0, 0, outputScale, 0, 0],
			}).promise;
			if (stale()) return;
			// Show pages as they arrive; the first render replaces the old PDF.
			if (number === 1) container.replaceChildren(canvas);
			else container.append(canvas);
		}
	} finally {
		void task.destroy();
	}
}

/**
 * Wires the language toggles: switching only changes the PDF the viewer shows
 * and the download link, it never navigates.
 */
export function initResumeViewer(viewer: HTMLElement): void {
	const pages = viewer.querySelector<HTMLElement>("[data-resume-pages]");
	const error = viewer.querySelector<HTMLElement>("[data-resume-error]");
	const download = document.querySelector<HTMLElement>(
		"[data-testid='resume-download']",
	);
	const toggles = document.querySelectorAll<GhToggle>("[data-resume-lang]");
	if (!pages || !error) return;
	const available = JSON.parse(viewer.dataset.available ?? "{}") as Record<
		Locale,
		boolean
	>;

	let shown = 0;
	const show = async (locale: Locale) => {
		const mine = ++shown;
		viewer.dataset.resumeLocale = locale;
		const url = resumePdfPath(locale);
		download?.setAttribute("href", url);
		for (const toggle of toggles)
			toggle.pressed = toggle.dataset.resumeLang === locale;
		error.hidden = true;
		for (const missing of viewer.querySelectorAll<HTMLElement>(
			"[data-resume-missing]",
		)) {
			missing.hidden = missing.dataset.resumeMissing !== locale;
		}
		if (!available[locale]) {
			bumpToken(pages);
			pages.replaceChildren();
			return;
		}
		try {
			await renderPdf(pages, url);
		} catch {
			if (mine !== shown) return;
			pages.replaceChildren();
			error.textContent = viewer.dataset.error ?? "";
			error.hidden = false;
		}
	};

	for (const toggle of toggles) {
		toggle.addEventListener("change", () => {
			const locale = toggle.dataset.resumeLang as Locale;
			if (viewer.dataset.resumeLocale === locale) {
				toggle.pressed = true;
				return;
			}
			void show(locale);
		});
	}
	void show(viewer.dataset.resumeLocale as Locale);
}
