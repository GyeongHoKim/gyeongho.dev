import { fileURLToPath } from "node:url";
import { createPost, NewPostError } from "../src/lib/new-post.ts";

function fail(reason) {
	console.error(`new-post: ${reason}`);
	process.exit(1);
}

const [slug, locale = "ko", ...extra] = process.argv.slice(2);
if (slug === undefined || extra.length > 0)
	fail("usage: pnpm new:post <slug> [ko|en]");

const root = fileURLToPath(new URL("..", import.meta.url));
try {
	console.log(await createPost(root, slug, locale, new Date()));
} catch (error) {
	if (!(error instanceof NewPostError)) throw error;
	fail(error.message);
}
