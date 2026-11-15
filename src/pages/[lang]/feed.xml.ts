import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getLocaleStaticPaths, type Locale, localePath, t } from "../../i18n";
import { getPosts, postSlug } from "../../lib/posts";

export const getStaticPaths = getLocaleStaticPaths;

export async function GET(context: APIContext) {
	const locale = context.params.lang as Locale;
	const posts = await getPosts(locale);
	return rss({
		title: t(locale, "feed.title"),
		description: t(locale, "feed.description"),
		site: new URL(localePath(locale), context.site),
		customData: `<language>${locale}</language>`,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: localePath(locale, `blog/${postSlug(post.id)}`),
			categories: post.data.tags,
		})),
	});
}
