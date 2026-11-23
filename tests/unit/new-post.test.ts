import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import {
	createPost,
	isValidSlug,
	NewPostError,
	postFilePath,
	postTemplate,
} from "../../src/lib/new-post";

test("slugs are lowercase words joined by hyphens", () => {
	expect(isValidSlug("fisheye-lens-model")).toBe(true);
	for (const bad of ["", "Fisheye", "a_b", "a--b", "-a", "a-", "a/b", "글"])
		expect(isValidSlug(bad)).toBe(false);
});
test("the file goes under the locale folder", () => {
	expect(postFilePath("fisheye-lens-model", "en")).toBe(
		"src/content/blog/en/fisheye-lens-model.md",
	);
});
test("the template is a draft dated today", () => {
	// Half past midnight in local time: the UTC day differs wherever the
	// offset is not zero, and the month and the day need their zero.
	const date = new Date(2027, 0, 5, 0, 30);
	const text = postTemplate("ko", date);
	expect(text).toContain("pubDate: 2027-01-05");
	expect(text).toContain("draft: true");
	expect(text).toContain("tags: []");

	const english = postTemplate("en", date);
	expect(english).toContain("pubDate: 2027-01-05");
	expect(english).toContain("draft: true");
});

const roots: string[] = [];
async function emptyRoot() {
	const root = await mkdtemp(join(tmpdir(), "new-post-"));
	roots.push(root);
	return root;
}
afterEach(async () => {
	for (const root of roots.splice(0))
		await rm(root, { recursive: true, force: true });
});

test("createPost writes the template and returns its path", async () => {
	const root = await emptyRoot();
	const date = new Date(2027, 0, 5, 0, 30);

	expect(await createPost(root, "my-post", "en", date)).toBe(
		"src/content/blog/en/my-post.md",
	);
	expect(
		await readFile(join(root, "src/content/blog/en/my-post.md"), "utf8"),
	).toBe(postTemplate("en", date));
});
test("createPost never overwrites a post", async () => {
	const root = await emptyRoot();
	const file = join(root, "src/content/blog/ko/my-post.md");
	await createPost(root, "my-post", "ko", new Date(2027, 0, 5));
	await writeFile(file, "my draft");

	const again = createPost(root, "my-post", "ko", new Date(2027, 0, 6));
	await expect(again).rejects.toThrow(NewPostError);
	await expect(again).rejects.toThrow(
		"src/content/blog/ko/my-post.md already exists",
	);
	expect(await readFile(file, "utf8")).toBe("my draft");
});
test("createPost writes nothing for a bad slug or language", async () => {
	const root = await emptyRoot();
	const date = new Date(2027, 0, 5);

	await expect(createPost(root, "Bad_Slug", "ko", date)).rejects.toThrow(
		NewPostError,
	);
	await expect(createPost(root, "../escape", "ko", date)).rejects.toThrow(
		/not a slug/,
	);
	await expect(createPost(root, "my-post", "fr", date)).rejects.toThrow(
		/"fr" is not a language/,
	);
	expect(await readdir(root)).toEqual([]);
});
