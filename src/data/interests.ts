import type { Locale } from "../i18n";

export interface Interest {
	kind: Record<Locale, string>;
	label: Record<Locale, string>;
}

const same = (text: string): Record<Locale, string> => ({ ko: text, en: text });

export const interests: Interest[] = [
	{ kind: same("Languages"), label: same("Go · TypeScript · JavaScript") },
	{ kind: same("Media"), label: same("FFmpeg · RTSP · WebRTC · HLS") },
	{ kind: same("Web API"), label: same("WebCodecs · WebGPU · WebMCP") },
	{ kind: same("UI"), label: same("React · Lit · Web Components · Storybook") },
	{ kind: same("Backend"), label: same("Gin") },
	{ kind: same("Infra"), label: same("Terraform · Docker") },
	{ kind: same("Test · CI"), label: same("Cypress · Jenkins · Drone CI") },
	{
		kind: { ko: "미디어 오픈소스", en: "Media open source" },
		label: same("mp4ff · moq-go · RTSPtoWeb"),
	},
	{
		kind: { ko: "임베디드", en: "Embedded" },
		label: { ko: "TinyGo 펌웨어", en: "TinyGo firmware" },
	},
	{ kind: same("Homelab"), label: same("NVR · IP Camera · K3s · Gitea") },
	{ kind: { ko: "영상 제작", en: "Video making" }, label: same("YouTube") },
	{
		kind: { ko: "취미", en: "Hobby" },
		label: { ko: "국궁", en: "Korean archery" },
	},
];
