import { type CollectionEntry, getCollection } from "astro:content";
import { isLocale, type Locale } from "../i18n";
import { SERIES, type Series } from "./series";
import { TAGS } from "./tags";

export { SERIES } from "./series";

export type Post = CollectionEntry<"blog">;

/** Drafts are visible in dev and on Vercel previews, never in production. */
export function showDrafts(env: {
	DEV: boolean;
	VERCEL_ENV?: string;
}): boolean {
	return env.DEV || env.VERCEL_ENV === "preview";
}

/** Entry ids look like "ko/dummy-post". */
export function postLocale(id: string): Locale {
	const [locale] = id.split("/");
	if (!isLocale(locale)) throw new Error(`Post id has no locale: ${id}`);
	return locale;
}

export function postSlug(id: string): string {
	return id.split("/").slice(1).join("/");
}

/**
 * Throws when a post uses a tag that is not in the list of its own locale.
 * The schema cannot check this because it does not see the entry id.
 */
export function assertLocaleTags(all: Post[]): void {
	for (const post of all) {
		const locale = postLocale(post.id);
		const allowed: readonly string[] = TAGS[locale];
		post.data.tags.forEach((tag, index) => {
			if (allowed.includes(tag)) return;
			throw new Error(
				`blog → ${post.id}: tags.${index} is "${tag}", which is not one of the ${locale} tags (${allowed.join(", ")}).`,
			);
		});
	}
}

/** Posts of one locale, newest first. */
export function selectPosts(
	all: Post[],
	locale: Locale,
	includeDrafts: boolean,
): Post[] {
	return all
		.filter(
			(post) =>
				postLocale(post.id) === locale && (includeDrafts || !post.data.draft),
		)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export async function getPosts(locale: Locale): Promise<Post[]> {
	const all = await getCollection("blog");
	assertLocaleTags(all);
	return selectPosts(
		all,
		locale,
		showDrafts({
			DEV: import.meta.env.DEV,
			VERCEL_ENV: process.env.VERCEL_ENV,
		}),
	);
}

export function groupByYear(posts: Post[]): { year: number; posts: Post[] }[] {
	const groups = new Map<number, Post[]>();
	for (const post of posts) {
		const year = post.data.pubDate.getUTCFullYear();
		groups.set(year, [...(groups.get(year) ?? []), post]);
	}
	return [...groups]
		.sort(([a], [b]) => b - a)
		.map(([year, list]) => ({ year, posts: list }));
}

export function groupBySeries(
	posts: Post[],
): { series: Series; posts: Post[] }[] {
	return SERIES.map((series) => ({
		series,
		posts: posts.filter((post) => post.data.series === series),
	})).filter((group) => group.posts.length > 0);
}
