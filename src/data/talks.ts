import type { Locale } from "../i18n";

export interface Talk {
	type: "seminar" | "award";
	title: Record<Locale, string>;
	event: Record<Locale, string>;
	date: string;
	/** 'review': slides are under confidentiality review, so no file is served. */
	slides: "review" | { href: string } | null;
}

/**
 * Newest first. The first entry is the "latest talk"; its venue, audience and
 * summary come from the talks.featured.* keys in src/i18n/ui.ts and must be
 * updated together with it.
 */
export const talks: Talk[] = [
	{
		type: "seminar",
		title: {
			ko: "프론트엔드 코어 라이브러리 소개, 개발 프로세스, CI/CD",
			en: "Frontend core library, development process, and CI/CD",
		},
		event: {
			ko: "아이디스 사내 세미나 · 9층 대회의실 · 연구 5팀 전원 대상",
			en: "IDIS in-house seminar · 9th-floor main conference room · All of Research Team 5",
		},
		date: "2026.04.29",
		slides: "review",
	},
	{
		type: "seminar",
		title: { ko: "프론트엔드 테스트 전략", en: "Frontend testing strategy" },
		event: {
			ko: "아이디스 사내 세미나 · 7층 중회의실 · 연구 5팀 프론트엔드 개발자 대상",
			en: "IDIS in-house seminar · 7th-floor meeting room · Research Team 5 frontend developers",
		},
		date: "2024.11.13",
		slides: "review",
	},
	{
		type: "award",
		title: { ko: "해커톤 대상", en: "Hackathon Grand Prize" },
		event: {
			ko: "GDSC · Alpaco 해커톤",
			en: "GDSC · Alpaco Hackathon",
		},
		date: "2023.12",
		slides: null,
	},
];
