import type { Locale } from "../i18n";

export interface BlogrollEntry {
	name: string;
	url: string;
	/** Short label shown on the 88x31 button wall. */
	wall: string;
	feed?: string;
	note: Record<Locale, string>;
}

/** Personal sites that inspired this one. */
export const blogroll: BlogrollEntry[] = [
	{
		name: "Nicky Case",
		url: "https://ncase.me/",
		wall: "ncase",
		feed: "https://ncase.me/feed.xml",
		note: {
			ko: "직접 만지며 배우는 인터랙티브 게임과 글, 발표를 모아 둔 곳.",
			en: "Interactive games, essays and talks you learn from by playing with them.",
		},
	},
	{
		name: "anhvn",
		url: "https://anhvn.com/",
		wall: "anhvn",
		feed: "https://anhvn.com/feed.xml",
		note: {
			ko: "일기 같은 블로그, 스케치북, 디지털 가든, 게임 기록이 아기자기하게 모인 개인 사이트.",
			en: "A cozy personal site with a diary-like blog, sketchbook, digital garden and game logs.",
		},
	},
	{
		name: "Mari",
		url: "https://marighoul.com/",
		wall: "marighoul",
		note: {
			ko: "만화가이자 일러스트레이터 Mari의 그림, 웹툰, 작업 이야기.",
			en: "Drawings, webcomics and behind-the-scenes notes from the cartoonist and illustrator Mari.",
		},
	},
];
