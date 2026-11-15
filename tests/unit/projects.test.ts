import { expect, it } from "vitest";
import { portfolioImage, portfolioVideo } from "../../src/lib/portfolio-assets";
import { parseProjects, projects } from "../../src/lib/projects";

const valid = {
	name: { ko: "fisheye.js", en: "fisheye.js" },
	description: {
		ko: "어안 영상을 디와핑하는 라이브러리",
		en: "Fisheye dewarping library",
	},
	tags: { ko: ["WebGPU"], en: ["WebGPU"] },
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
	expect(
		parseProjects([{ ...valid, links: [], portfolioOnly: true }]),
	).toHaveLength(1);
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

const showcase = {
	chapter: "oss",
	detail: { ko: "자세한 설명", en: "Longer description" },
	did: { ko: ["하나"], en: ["One"] },
	address: "github.com/GyeongHoKim/fisheye.js",
	media: {
		kind: "image",
		src: "fisheye-after.jpg",
		alt: { ko: "디와핑한 사진", en: "Straightened photo" },
	},
};
it("accepts the optional Portfolio fields", () => {
	const [project] = parseProjects([{ ...valid, ...showcase }]);
	expect(project.chapter).toBe("oss");
	expect(project.did?.en).toEqual(["One"]);
	expect(project.address).toBe("github.com/GyeongHoKim/fisheye.js");
	expect(project.media?.kind).toBe("image");
});
it("rejects bad Portfolio fields and names the field", () => {
	expect(() => parseProjects([{ ...valid, chapter: "work" }])).toThrow(
		/chapter/,
	);
	expect(() =>
		parseProjects([{ ...valid, did: { ko: ["하나"], en: [] } }]),
	).toThrow(/did/);
	expect(() =>
		parseProjects([{ ...valid, media: { kind: "slideshow" } }]),
	).toThrow(/media/);
	expect(() => parseProjects([{ ...valid, media: { kind: "flow" } }])).toThrow(
		/media/,
	);
	expect(() =>
		parseProjects([{ ...valid, media: { kind: "custom", component: "x" } }]),
	).toThrow(/media.*component/s);
});
it("takes media files by name only and checks their type", () => {
	const alt = { ko: "화면", en: "Screen" };
	for (const src of ["shots/screen.png", "../screen.png", "screen.mp4"])
		expect(() =>
			parseProjects([{ ...valid, media: { kind: "image", src, alt } }]),
		).toThrow(/media.*src/s);
	expect(() =>
		parseProjects([
			{ ...valid, media: { kind: "video", src: "screen.png", label: alt } },
		]),
	).toThrow(/media.*src/s);
	expect(() =>
		parseProjects([{ ...valid, media: { kind: "image", src: "screen.png" } }]),
	).toThrow(/media.*alt/s);
});
it("finds every media file the shipped data names", () => {
	for (const { media } of projects) {
		if (media?.kind === "image") portfolioImage(media.src);
		if (media?.kind === "video") {
			expect(portfolioVideo(media.src)).toContain(".mp4");
			if (media.poster) portfolioImage(media.poster);
		}
	}
	expect(() => portfolioImage("missing.png")).toThrow(
		/src\/assets\/portfolio\/missing\.png does not exist/,
	);
	expect(() => portfolioVideo("missing.mp4")).toThrow(/does not exist/);
});
