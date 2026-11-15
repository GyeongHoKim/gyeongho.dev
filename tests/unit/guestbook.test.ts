import { expect, it, vi } from "vitest";
import {
	guestbookTargets,
	loadGuestbook,
	toGuestbookEntries,
} from "../../src/lib/guestbook";
import type { Mention } from "../../src/lib/webmentions";

const m = (
	type: Mention["type"],
	url: string,
	extra: Partial<Mention> = {},
): Mention => ({
	type,
	url,
	author: { name: "A", url: "https://a.example" },
	...extra,
});

it("builds both locale targets", () => {
	expect(guestbookTargets(new URL("https://gyeongho.dev"))).toEqual([
		"https://gyeongho.dev/ko/guestbook/",
		"https://gyeongho.dev/en/guestbook/",
	]);
});
it("keeps replies and mentions, drops likes and reposts", () => {
	const entries = toGuestbookEntries([
		m("like", "https://a.example/1"),
		m("reply", "https://a.example/2", { text: "hello" }),
		m("repost", "https://a.example/3"),
		m("mention", "https://a.example/4", { text: "hi" }),
	]);
	expect(entries.map((e) => e.text)).toEqual(["hello", "hi"]);
});
it("merges duplicates by source and sorts newest first, undated last", () => {
	const entries = toGuestbookEntries([
		m("reply", "https://a.example/old", {
			text: "old",
			published: new Date("2026-01-01"),
		}),
		m("reply", "https://a.example/none", { text: "none" }),
		m("reply", "https://a.example/new", {
			text: "new",
			published: new Date("2026-06-01"),
		}),
		m("mention", "https://a.example/new", {
			text: "new",
			published: new Date("2026-06-01"),
		}),
	]);
	expect(entries.map((e) => e.text)).toEqual(["new", "old", "none"]);
});
it("truncates long text and falls back to the source URL", () => {
	const [long, bare] = toGuestbookEntries([
		m("reply", "https://a.example/long", { text: "x".repeat(400) }),
		m("mention", "https://a.example/bare"),
	]);
	expect(long.text).toHaveLength(280);
	expect(long.text.endsWith("…")).toBe(true);
	expect(bare.text).toBe("https://a.example/bare");
});
it("returns [] without a token and when fetch throws", async () => {
	const site = new URL("https://gyeongho.dev");
	const throwing = vi.fn().mockRejectedValue(new Error("offline"));
	expect(await loadGuestbook(site, {})).toEqual([]);
	expect(await loadGuestbook(site, { token: "t", fetch: throwing })).toEqual(
		[],
	);
});
it("queries both targets and dedupes a source sent to both", async () => {
	const site = new URL("https://gyeongho.dev");
	const children = [
		{
			"wm-property": "in-reply-to",
			"wm-id": 1,
			url: "https://a.example/1",
			"wm-target": "https://gyeongho.dev/ko/guestbook/",
			author: { name: "A", url: "https://a.example" },
			content: { text: "hello" },
		},
	];
	const fetchMock = vi.fn(
		async (_url: string | URL | Request) =>
			new Response(JSON.stringify({ children }), { status: 200 }),
	);
	const entries = await loadGuestbook(site, {
		token: "t",
		fetch: fetchMock as unknown as typeof fetch,
	});
	const urls = fetchMock.mock.calls.map((c) => String(c[0]));
	expect(
		urls.some((u) =>
			u.includes(encodeURIComponent("https://gyeongho.dev/ko/guestbook/")),
		),
	).toBe(true);
	expect(
		urls.some((u) =>
			u.includes(encodeURIComponent("https://gyeongho.dev/en/guestbook/")),
		),
	).toBe(true);
	expect(entries).toHaveLength(1);
});
