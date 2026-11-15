import { expect, it, vi } from "vitest";
import { fetchMentions, parseMentions } from "../../src/lib/webmentions";

const jf2 = {
	type: "feed",
	children: [
		{
			"wm-property": "like-of",
			url: "https://a.example/1",
			author: { name: "A", url: "https://a.example" },
		},
		{
			"wm-property": "in-reply-to",
			url: "https://b.example/2",
			author: { name: "B" },
			published: "2026-11-01T00:00:00Z",
			content: { text: "nice" },
		},
		{
			"wm-property": "repost-of",
			url: "https://c.example/3",
			author: { name: "C" },
		},
		{
			"wm-property": "mention-of",
			url: "https://d.example/4",
			author: { name: "" },
		},
		{ nonsense: true },
	],
};

it("maps jf2 entries and skips malformed ones", () => {
	const mentions = parseMentions(jf2);
	expect(mentions.map((m) => m.type)).toEqual([
		"like",
		"reply",
		"repost",
		"mention",
	]);
	expect(mentions[1].text).toBe("nice");
	expect(mentions[1].published).toEqual(new Date("2026-11-01T00:00:00Z"));
	expect(mentions[3].author.name).toBe("d.example");
});

it("maps author url and photo and ignores unknown properties and bad dates", () => {
	const [mention] = parseMentions({
		children: [
			{
				"wm-property": "like-of",
				url: "https://a.example/1",
				author: {
					name: "A",
					url: "https://a.example",
					photo: "https://avatars.webmention.io/a.example/p.jpg",
				},
				published: "not a date",
			},
			{ "wm-property": "bookmark-of", url: "https://z.example/" },
		],
	});
	expect(mention.author).toEqual({
		name: "A",
		url: "https://a.example",
		photo: "https://avatars.webmention.io/a.example/p.jpg",
	});
	expect(mention.published).toBeUndefined();
	expect(
		parseMentions({
			children: [{ "wm-property": "bookmark-of", url: "https://z.example/" }],
		}),
	).toEqual([]);
});

it("drops non-http(s) urls", () => {
	const mentions = parseMentions({
		children: [
			{ "wm-property": "like-of", url: "javascript:alert(1)" },
			{
				"wm-property": "like-of",
				url: "https://a.example/1",
				author: {
					name: "A",
					url: "javascript:alert(1)",
					photo: "data:image/png;base64,AAAA",
				},
			},
		],
	});
	expect(mentions).toHaveLength(1);
	expect(mentions[0].author).toEqual({ name: "A" });
});

it("returns [] for non-feed input", () => {
	expect(parseMentions(null)).toEqual([]);
	expect(parseMentions({ children: "x" })).toEqual([]);
});

it("returns [] without a token and does not call fetch", async () => {
	const spy = vi.fn();
	expect(
		await fetchMentions("https://gyeongho.dev/ko/blog/x/", { fetch: spy }),
	).toEqual([]);
	expect(spy).not.toHaveBeenCalled();
});

it("returns [] when the request fails or throws", async () => {
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const failing = vi.fn().mockResolvedValue(new Response("", { status: 500 }));
	const throwing = vi.fn().mockRejectedValue(new Error("offline"));
	expect(
		await fetchMentions("https://x/", { token: "t", fetch: failing }),
	).toEqual([]);
	expect(
		await fetchMentions("https://x/", { token: "t", fetch: throwing }),
	).toEqual([]);
});

it("requests the target with the token", async () => {
	const ok = vi.fn().mockResolvedValue(Response.json(jf2));
	await fetchMentions("https://gyeongho.dev/ko/blog/x/", {
		token: "t",
		fetch: ok,
	});
	const url = new URL(ok.mock.calls[0][0]);
	expect(url.origin + url.pathname).toBe(
		"https://webmention.io/api/mentions.jf2",
	);
	expect(url.searchParams.get("target")).toBe(
		"https://gyeongho.dev/ko/blog/x/",
	);
	expect(url.searchParams.get("token")).toBe("t");
});
