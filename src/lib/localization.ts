/**
 * Lit Localize runtime configuration.
 * Exports getLocale/setLocale for locale switcher and document title/lang updates.
 */

import { configureLocalization } from "@lit/localize";
import { allLocales, sourceLocale, targetLocales } from "../generated/locale-codes.ts";

const LOCALE_STORAGE_KEY = "gyeongho-dev-locale";

export const { getLocale, setLocale } = configureLocalization({
	sourceLocale,
	targetLocales: [...targetLocales],
	loadLocale: (locale: string) =>
		import(`../generated/locales/${locale}.ts`),
});

/**
 * Restore saved locale on init (call once from main or app root).
 */
export function initLocale(): void {
	if (typeof localStorage === "undefined") return;
	const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
	if (saved && (allLocales as readonly string[]).includes(saved)) {
		setLocale(saved);
	}
}

/**
 * Set locale and persist for next visit.
 */
export function setLocaleAndSave(locale: string): Promise<void> {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	}
	return setLocale(locale);
}
