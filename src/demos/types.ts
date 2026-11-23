import type { Locale } from "../i18n";

/** What the loader tells a demo about the page it is on. */
export interface DemoContext {
	locale: Locale;
	reducedMotion: boolean;
}

/**
 * What `src/demos/<name>/index.ts` exports. `mount` draws only inside `stage`;
 * the fallback content around it stays visible until `mount` has finished.
 */
export interface DemoModule {
	mount(stage: HTMLElement, context: DemoContext): void | Promise<void>;
}
