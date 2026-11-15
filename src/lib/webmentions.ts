export type Mention = {
	type: "like" | "repost" | "reply" | "mention";
	url: string;
	author: { name: string; url?: string; photo?: string };
	published?: Date;
	text?: string;
};

const ENDPOINT = "https://webmention.io/api/mentions.jf2";

const TYPES: Record<string, Mention["type"]> = {
	"like-of": "like",
	"repost-of": "repost",
	"in-reply-to": "reply",
	"mention-of": "mention",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const str = (value: unknown): string | undefined =>
	typeof value === "string" && value !== "" ? value : undefined;

const httpUrl = (value: unknown): string | undefined => {
	const text = str(value);
	if (text === undefined) return undefined;
	try {
		const { protocol } = new URL(text);
		return protocol === "http:" || protocol === "https:" ? text : undefined;
	} catch {
		return undefined;
	}
};

function parseMention(entry: unknown): Mention | undefined {
	if (!isRecord(entry)) return undefined;
	const property = str(entry["wm-property"]);
	const type = property === undefined ? undefined : TYPES[property];
	const url = httpUrl(entry.url);
	if (type === undefined || url === undefined) return undefined;
	let hostname: string;
	try {
		hostname = new URL(url).hostname;
	} catch {
		return undefined;
	}
	const author = isRecord(entry.author) ? entry.author : {};
	const mention: Mention = {
		type,
		url,
		author: { name: str(author.name) ?? hostname },
	};
	const authorUrl = httpUrl(author.url);
	if (authorUrl) mention.author.url = authorUrl;
	const photo = proxiedPhoto(author.photo);
	if (photo) mention.author.photo = photo;
	const published = str(entry.published);
	if (published) {
		const date = new Date(published);
		if (!Number.isNaN(date.getTime())) mention.published = date;
	}
	const text = isRecord(entry.content) ? str(entry.content.text) : undefined;
	if (text)
		mention.text =
			text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
	return mention;
}

/** Longest reply text shown on a post. */
const MAX_TEXT = 1000;

/** Keeps only avatars served by webmention.io's proxy, so visitors never contact a sender-chosen host. */
function proxiedPhoto(value: unknown): string | undefined {
	const url = httpUrl(value);
	if (!url) return undefined;
	const { protocol, hostname } = new URL(url);
	const trusted =
		hostname === "webmention.io" || hostname.endsWith(".webmention.io");
	return protocol === "https:" && trusted ? url : undefined;
}

/** Maps a webmention.io jf2 feed to mentions, skipping malformed entries. */
export function parseMentions(json: unknown): Mention[] {
	if (!isRecord(json) || !Array.isArray(json.children)) return [];
	return json.children.flatMap((entry) => parseMention(entry) ?? []);
}

/** Fetches one page (per-page=100); older mentions beyond that are not paginated. Never throws: without a token, or on any failure, returns []. */
export async function fetchMentions(
	target: string,
	options: { token?: string; fetch?: typeof fetch },
): Promise<Mention[]> {
	const { token, fetch: doFetch = fetch } = options;
	if (!token) return [];
	try {
		const url = new URL(ENDPOINT);
		url.searchParams.set("target", target);
		url.searchParams.set("token", token);
		url.searchParams.set("per-page", "100");
		const response = await doFetch(url.href, {
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) {
			console.warn(`webmention.io responded ${response.status}`);
			return [];
		}
		return parseMentions(await response.json());
	} catch (error) {
		console.warn("webmention.io request failed", error);
		return [];
	}
}
