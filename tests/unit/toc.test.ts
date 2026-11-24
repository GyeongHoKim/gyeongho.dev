import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, it } from "vitest";
import Toc from "../../src/components/Toc.astro";

const heading = (depth: number, text: string) => ({ depth, text, slug: text });

/** The lists of the rendered component, without attributes and white space. */
async function lists(headings: ReturnType<typeof heading>[]) {
	const container = await AstroContainer.create();
	const html = await container.renderToString(Toc, {
		props: { headings, locale: "en" },
	});
	const list = /<ol[\s\S]*<\/ol>/.exec(html)?.[0] ?? "";
	return list
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<(\/?[a-z0-9-]+)[^>]*>/g, "<$1>")
		.replace(/\s+/g, "");
}

it("numbers the h2 headings and lists the h3 headings under them", async () => {
	expect(
		await lists([
			heading(2, "a"),
			heading(3, "a1"),
			heading(3, "a2"),
			heading(2, "b"),
			heading(4, "deep"),
			heading(2, "c"),
			heading(3, "c1"),
		]),
	).toBe(
		"<ol>" +
			"<li><a>a</a><ul><li><a>a1</a></li><li><a>a2</a></li></ul></li>" +
			"<li><a>b</a></li>" +
			"<li><a>c</a><ul><li><a>c1</a></li></ul></li>" +
			"</ol>",
	);
});
it("an h3 before the first h2 is an entry of its own", async () => {
	expect(await lists([heading(3, "intro"), heading(2, "a")])).toBe(
		"<ol><li><a>intro</a></li><li><a>a</a></li></ol>",
	);
});
it("links every entry to its heading", async () => {
	const container = await AstroContainer.create();
	const html = await container.renderToString(Toc, {
		props: {
			headings: [
				{ depth: 2, text: "A", slug: "a" },
				{ depth: 3, text: "B", slug: "b" },
			],
			locale: "en",
		},
	});
	expect(html).toContain('href="#a"');
	expect(html).toContain('href="#b"');
});
it("renders nothing without headings", async () => {
	expect(await lists([])).toBe("");
});
