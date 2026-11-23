import { z } from "astro/zod";
import { SERIES } from "./series";
import { ALL_TAGS } from "./tags";

/** Front matter of a blog post. */
export const postSchema = z.object({
	title: z.string(),
	description: z.string(),
	pubDate: z.coerce.date(),
	tags: z.array(z.enum(ALL_TAGS)),
	series: z.enum(SERIES).optional(),
	draft: z.boolean().default(false),
});
