import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { postSchema } from "./lib/post-schema";

const blog = defineCollection({
	loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
	schema: postSchema,
});

export const collections = { blog };
