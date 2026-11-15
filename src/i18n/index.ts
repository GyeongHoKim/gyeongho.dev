import { ui } from "./ui";

export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type UiKey = keyof typeof ui.ko;

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

/** Returns the first ko/en entry of the list, or the default locale. */
export function pickLocale(languages: readonly string[]): Locale {
	for (const language of languages) {
		const primary = language.toLowerCase().split("-")[0];
		if (isLocale(primary)) return primary;
	}
	return DEFAULT_LOCALE;
}

/** Builds "/{locale}/{path}/" and keeps a "#hash" after the trailing slash. */
export function localePath(locale: Locale, path = ""): string {
	const [pathname, ...rest] = path.split("#");
	const hash = rest.length > 0 ? `#${rest.join("#")}` : "";
	const segments = pathname.split("/").filter(Boolean);
	return `/${[locale, ...segments].join("/")}/${hash}`;
}

export function switchLocalePath(pathname: string, to: Locale): string {
	const [first, ...rest] = pathname.split("/").filter(Boolean);
	const tail = first !== undefined && isLocale(first) ? rest : [first, ...rest];
	return localePath(to, tail.filter(Boolean).join("/"));
}

export function getLocaleStaticPaths(): { params: { lang: Locale } }[] {
	return LOCALES.map((lang) => ({ params: { lang } }));
}

export function t(locale: Locale, key: UiKey): string {
	return ui[locale][key];
}
