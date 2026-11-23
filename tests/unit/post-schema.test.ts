import { expect, test } from "vitest";
import { postSchema } from "../../src/lib/post-schema";
import { TAGS } from "../../src/lib/tags";

const base = {
	title: "t",
	description: "d",
	pubDate: "2026-11-24",
	tags: ["영상"],
};

test("there are seven tags per locale", () => {
	expect(TAGS.ko).toEqual([
		"WebGPU",
		"영상",
		"Go",
		"프론트엔드",
		"테스트",
		"오픈소스",
		"회고",
	]);
	expect(TAGS.en).toEqual([
		"WebGPU",
		"Video",
		"Go",
		"Frontend",
		"Testing",
		"Open source",
		"Retrospective",
	]);
});
test("a valid post passes and draft defaults to false", () => {
	expect(postSchema.parse(base).draft).toBe(false);
});
test("an unknown tag is rejected at its index", () => {
	const result = postSchema.safeParse({ ...base, tags: ["영상", "dummy"] });
	expect(result.success).toBe(false);
	expect(result.error?.issues[0]?.path).toEqual(["tags", 1]);
});
test("an unknown series is rejected", () => {
	expect(postSchema.safeParse({ ...base, series: "없는 시리즈" }).success).toBe(
		false,
	);
});
test("a missing title is rejected", () => {
	const { title: _title, ...rest } = base;
	expect(postSchema.safeParse(rest).success).toBe(false);
});
