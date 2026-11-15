import { expect, it } from "vitest";
import {
	groupBySeries,
	groupByYear,
	type Post,
	postLocale,
	postSlug,
	selectPosts,
	showDrafts,
} from "../../src/lib/posts";
import { matchesFilter } from "../../src/scripts/blog";

const post = (id: string, pubDate: string, extra = {}) =>
	({
		id,
		data: {
			title: id,
			description: "",
			pubDate: new Date(pubDate),
			tags: [],
			draft: false,
			...extra,
		},
	}) as unknown as Post;

it("shows drafts in dev and on Vercel previews only", () => {
	expect(showDrafts({ DEV: true })).toBe(true);
	expect(showDrafts({ DEV: false, VERCEL_ENV: "preview" })).toBe(true);
	expect(showDrafts({ DEV: false, VERCEL_ENV: "production" })).toBe(false);
	expect(showDrafts({ DEV: false })).toBe(false);
});
it("splits ids", () => {
	expect(postLocale("ko/dummy-post")).toBe("ko");
	expect(postSlug("en/dummy-post")).toBe("dummy-post");
});
it("selects by locale, drops drafts and sorts newest first", () => {
	const all = [
		post("ko/a", "2026-01-01"),
		post("ko/b", "2026-03-01"),
		post("en/a", "2026-01-01"),
		post("ko/c", "2026-02-01", { draft: true }),
	];
	expect(selectPosts(all, "ko", false).map((p) => p.id)).toEqual([
		"ko/b",
		"ko/a",
	]);
	expect(selectPosts(all, "ko", true).map((p) => p.id)).toEqual([
		"ko/b",
		"ko/c",
		"ko/a",
	]);
});
it("groups by year, newest year first", () => {
	const groups = groupByYear([
		post("ko/a", "2026-03-01"),
		post("ko/b", "2025-12-31"),
	]);
	expect(groups.map((g) => g.year)).toEqual([2026, 2025]);
});
it("groups by series in SERIES order and skips empty ones", () => {
	const groups = groupBySeries([
		post("ko/a", "2026-01-01", { series: "GPGPU(WebGPU)" }),
		post("ko/b", "2026-01-02", { series: "FishEye" }),
		post("ko/c", "2026-01-03"),
	]);
	expect(groups.map((g) => g.series)).toEqual(["FishEye", "GPGPU(WebGPU)"]);
});

it("filters by tag and series together", () => {
	const post = { tags: ["Go", "CLI"], series: "FishEye" };
	expect(matchesFilter(post, { tag: "all", series: "all" })).toBe(true);
	expect(matchesFilter(post, { tag: "Go", series: "all" })).toBe(true);
	expect(matchesFilter(post, { tag: "WebGPU", series: "all" })).toBe(false);
	expect(matchesFilter(post, { tag: "Go", series: "FishEye" })).toBe(true);
	expect(matchesFilter(post, { tag: "Go", series: "미디어 서버" })).toBe(false);
});
