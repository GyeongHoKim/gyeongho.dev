import { expect, it, vi } from "vitest";
import {
	assertLocaleTags,
	getPosts,
	groupBySeries,
	groupByYear,
	type Post,
	postLocale,
	postSlug,
	selectPosts,
	showDrafts,
} from "../../src/lib/posts";
import { matchesFilter } from "../../src/scripts/blog";

// getPosts() reads the collection through astro:content; the test supplies the entries.
const getCollection = vi.hoisted(() => vi.fn());
vi.mock("astro:content", () => ({ getCollection }));

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
it("accepts posts that use the tags of their own locale", () => {
	expect(() =>
		assertLocaleTags([
			post("ko/a", "2026-01-01", { tags: ["영상", "WebGPU"] }),
			post("en/a", "2026-01-01", { tags: ["Video", "WebGPU"] }),
			post("en/b", "2026-01-01"),
		]),
	).not.toThrow();
});
it("rejects a tag of the other locale and names the post and the item", () => {
	expect(() =>
		assertLocaleTags([
			post("ko/a", "2026-01-01", { tags: ["영상"] }),
			post("en/a", "2026-01-01", { tags: ["Video", "영상"] }),
		]),
	).toThrow(/en\/a.*tags\.1.*영상/);
	expect(() =>
		assertLocaleTags([post("ko/b", "2026-01-01", { tags: ["Video"] })]),
	).toThrow(/ko\/b.*tags\.0.*Video/);
});
it("getPosts checks the tags of every post before it selects", async () => {
	getCollection.mockResolvedValue([
		post("ko/a", "2026-01-01", { tags: ["영상"] }),
		post("en/a", "2026-01-01", { tags: ["Video"] }),
	]);
	expect((await getPosts("ko")).map((p) => p.id)).toEqual(["ko/a"]);

	// The en post is wrong, and the ko list fails too: no page is built from it.
	getCollection.mockResolvedValue([
		post("ko/a", "2026-01-01", { tags: ["영상"] }),
		post("en/a", "2026-01-01", { tags: ["영상"] }),
	]);
	await expect(getPosts("ko")).rejects.toThrow(/en\/a.*tags\.0.*영상/);
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
