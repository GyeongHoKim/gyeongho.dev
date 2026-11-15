import { expect, it } from "vitest";
import { parseProjects, projects } from "../../src/lib/projects";

const valid = {
	name: "fisheye.js",
	description: {
		ko: "어안 영상을 펴는 라이브러리",
		en: "Fisheye dewarping library",
	},
	tags: ["WebGPU"],
	links: [
		{
			label: { ko: "GitHub", en: "GitHub" },
			href: "https://github.com/GyeongHoKim/fisheye.js",
		},
	],
};
it("accepts a valid list", () => {
	expect(parseProjects([valid])).toHaveLength(1);
});
it("rejects a missing English description and names the field", () => {
	const bad = { ...valid, description: { ko: "x" } };
	expect(() => parseProjects([bad])).toThrow(/0.*description.*en/s);
});
it("rejects an empty links list and a non-URL href", () => {
	expect(() => parseProjects([{ ...valid, links: [] }])).toThrow(/links/);
	expect(() =>
		parseProjects([
			{ ...valid, links: [{ label: valid.links[0].label, href: "nope" }] },
		]),
	).toThrow(/href/);
});
it("rejects non-http URLs and already-prefixed site paths", () => {
	for (const href of [
		"mailto:x@y.z",
		"ftp://x.y/z",
		"/ko/portfolio/",
		"/en/",
		"/ko",
		"/en",
	])
		expect(() =>
			parseProjects([
				{ ...valid, links: [{ label: valid.links[0].label, href }] },
			]),
		).toThrow(/href/);
	expect(() =>
		parseProjects([
			{
				...valid,
				links: [{ label: valid.links[0].label, href: "/portfolio/" }],
			},
		]),
	).not.toThrow();
});
it("the shipped data file is valid", () => {
	expect(projects.length).toBeGreaterThan(0);
});
