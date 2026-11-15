import type { Locale } from "../i18n";

/** Front matter value of a post series. It is also the filter key, so it never changes with the locale. */
export const SERIES = ["FishEye", "미디어 서버", "GPGPU(WebGPU)"] as const;
export type Series = (typeof SERIES)[number];

/** The name of a series as shown to readers of each locale. */
export const SERIES_LABELS: Record<Series, Record<Locale, string>> = {
	FishEye: { ko: "FishEye", en: "FishEye" },
	"미디어 서버": { ko: "미디어 서버", en: "Media server" },
	"GPGPU(WebGPU)": { ko: "GPGPU(WebGPU)", en: "GPGPU(WebGPU)" },
};
