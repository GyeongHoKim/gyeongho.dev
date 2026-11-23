import type { DemoContext, DemoModule } from "../demos/types";
import { DEFAULT_LOCALE, isLocale } from "../i18n";

export type DemoImporters = Record<string, () => Promise<unknown>>;

const PREFIX = "demo-";

/** "DEMO-FISHEYE-INVERSE" -> "fisheye-inverse"; null when the tag is not a demo tag. */
export function demoName(tagName: string): string | null {
	const tag = tagName.toLowerCase();
	if (!tag.startsWith(PREFIX) || tag.length === PREFIX.length) return null;
	return tag.slice(PREFIX.length);
}

/** The importer of `src/demos/<name>/index.ts`, whatever the glob keys are relative to. */
export function findImporter(
	importers: DemoImporters,
	name: string,
): (() => Promise<unknown>) | undefined {
	const suffix = `/demos/${name}/index.ts`;
	const key = Object.keys(importers).find((path) => path.endsWith(suffix));
	return key === undefined ? undefined : importers[key];
}

function isDemoModule(value: unknown): value is DemoModule {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as { mount?: unknown }).mount === "function"
	);
}

async function load(
	host: HTMLElement,
	name: string,
	importers: DemoImporters,
	context: DemoContext,
): Promise<void> {
	host.dataset.demoState = "loading";
	const stage = document.createElement("div");
	stage.dataset.demoStage = "";
	try {
		const importer = findImporter(importers, name);
		if (!importer) throw new Error(`src/demos/${name}/index.ts does not exist`);
		const module = await importer();
		if (!isDemoModule(module))
			throw new Error(`src/demos/${name}/index.ts does not export mount()`);
		host.append(stage);
		await module.mount(stage, context);
		host.dataset.demoState = "ready";
	} catch (error) {
		stage.remove();
		host.dataset.demoState = "failed";
		console.error(`Demo "${name}" failed, its fallback stays.`, error);
	}
}

/**
 * Finds the demo tags under `root` and loads each demo the first time its tag
 * comes near the viewport. The tag shows its state in `data-demo-state`:
 * absent (waiting), "loading", then "ready" or "failed".
 */
export function initDemos(root: ParentNode, importers: DemoImporters): void {
	const hosts = new Map<Element, string>();
	for (const element of root.querySelectorAll<HTMLElement>("*")) {
		const name = demoName(element.localName);
		if (name !== null) hosts.set(element, name);
	}
	if (hosts.size === 0) return;

	const lang = document.documentElement.lang;
	const context: DemoContext = {
		locale: isLocale(lang) ? lang : DEFAULT_LOCALE,
		reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
	};
	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				observer.unobserve(entry.target);
				const name = hosts.get(entry.target);
				if (name === undefined) continue;
				// A host is loaded once, even if the observer reports it again.
				hosts.delete(entry.target);
				void load(entry.target as HTMLElement, name, importers, context);
			}
		},
		{ rootMargin: "600px 0px" },
	);
	for (const host of hosts.keys()) observer.observe(host);
}
