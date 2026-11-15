import { expect, test } from "@playwright/test";
import projects from "../../src/data/projects.json" with { type: "json" };

// Portfolio lists company work first, then open source, keeping JSON order within each.
const chapter = (p: { chapter?: string }) =>
	p.chapter === "company" ? 0 : p.chapter === "oss" ? 1 : 2;
const expected = [...projects].sort((a, b) => chapter(a) - chapter(b));

test("shows every project from projects.json", async ({ page }) => {
	await page.goto("/en/portfolio/");
	const names = await page.getByTestId("project-name").allTextContents();
	expect(names).toEqual(expected.map((p) => p.name.en));
});
type Media = { kind: string; src?: string; label?: { en: string } };
const mediaOf = (project: object) => (project as { media?: Media }).media;

test("each screen is the kind its project asks for", async ({ page }) => {
	await page.goto("/en/portfolio/");
	const cards = page.locator("[data-card]");
	const kinds = await cards.evaluateAll((els) =>
		els.map((el) => (el as HTMLElement).dataset.kind),
	);
	expect(kinds).toEqual(
		expected.map((project) => mediaOf(project)?.kind ?? "placeholder"),
	);
	for (const [i, project] of expected.entries()) {
		const media = mediaOf(project);
		if (media?.kind !== "video") continue;
		const video = cards.nth(i).locator("video");
		const stem = (media.src ?? "").replace(/\.\w+$/, "");
		await expect(video).toHaveAttribute("src", new RegExp(stem));
		await expect(video).toHaveAttribute("aria-label", media.label?.en ?? "");
	}
});
test("no project links back to the portfolio page it is shown on", async ({
	page,
}) => {
	await page.goto("/en/portfolio/");
	await expect(page.locator('.steps a[href="/en/portfolio/"]')).toHaveCount(0);
});
test("card stack switches instantly with reduced motion", async ({
	browser,
}) => {
	const context = await browser.newContext({ reducedMotion: "reduce" });
	const page = await context.newPage();
	await page.goto("/ko/portfolio/");
	const stack = page.getByTestId("card-stack").first();
	await stack.getByRole("button", { name: /다음|Next/ }).click();
	await expect(stack.getByTestId("card-counter")).toHaveText(/^2 \//);
	expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
	await context.close();
});
