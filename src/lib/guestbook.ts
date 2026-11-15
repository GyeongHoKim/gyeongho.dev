import { fetchMentions, type Mention } from "./webmentions";

export const WEBMENTION_ENDPOINT =
	"https://webmention.io/gyeongho.dev/webmention";

const MAX_TEXT = 280;

export type GuestbookEntry = {
	author: string;
	authorUrl?: string;
	text: string;
	source: string;
	date?: Date;
};

/** Both locale pages, so a link to either one lands on the same wall. */
export function guestbookTargets(site: URL): string[] {
	return ["ko", "en"].map((lang) => new URL(`/${lang}/guestbook/`, site).href);
}

const clip = (text: string): string =>
	text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;

/** Keeps replies and mentions, one entry per source, newest first, undated last. */
export function toGuestbookEntries(mentions: Mention[]): GuestbookEntry[] {
	const bySource = new Map<string, GuestbookEntry>();
	for (const mention of mentions) {
		if (mention.type !== "reply" && mention.type !== "mention") continue;
		if (bySource.has(mention.url)) continue;
		const entry: GuestbookEntry = {
			author: mention.author.name,
			text: clip(mention.text ?? mention.url),
			source: mention.url,
		};
		if (mention.author.url) entry.authorUrl = mention.author.url;
		if (mention.published) entry.date = mention.published;
		bySource.set(mention.url, entry);
	}
	const time = (entry: GuestbookEntry) => entry.date?.getTime();
	return [...bySource.values()].sort((a, b) => {
		const ta = time(a);
		const tb = time(b);
		if (ta === tb) return 0;
		if (ta === undefined) return 1;
		if (tb === undefined) return -1;
		return tb - ta;
	});
}

/** Reads both locale targets. Never throws: without a token, or on failure, returns []. */
export async function loadGuestbook(
	site: URL,
	options: { token?: string; fetch?: typeof fetch },
): Promise<GuestbookEntry[]> {
	const lists = await Promise.all(
		guestbookTargets(site).map((target) => fetchMentions(target, options)),
	);
	return toGuestbookEntries(lists.flat());
}
