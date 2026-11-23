import type { Locale } from "../i18n";

/** The only tags a post may use. A post picks from the list of its own locale. */
export const TAGS = {
	ko: ["WebGPU", "영상", "Go", "프론트엔드", "테스트", "오픈소스", "회고"],
	en: [
		"WebGPU",
		"Video",
		"Go",
		"Frontend",
		"Testing",
		"Open source",
		"Retrospective",
	],
} as const satisfies Record<Locale, readonly string[]>;

export type Tag = (typeof TAGS)[Locale][number];

/** Every tag of both locales, without duplicates. */
export const ALL_TAGS = [...new Set<Tag>([...TAGS.ko, ...TAGS.en])] as [
	Tag,
	...Tag[],
];
