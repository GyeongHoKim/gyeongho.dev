import { expect, test } from "@playwright/test";
import projects from "../../src/data/projects.json" with { type: "json" };

test("shows a fallback without WebGPU and logs no errors", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.addInitScript(() => {
		Object.defineProperty(navigator, "gpu", { value: undefined });
	});
	await page.goto("/ko/");
	await expect(page.getByTestId("fisheye-fallback")).toBeVisible();
	expect(errors).toEqual([]);
});
test("lists every project and shows the empty Lately state", async ({
	page,
}) => {
	await page.goto("/en/");
	await expect(page.locator("gh-card[variant=sticky]")).toHaveCount(
		projects.filter((project) => !("portfolioOnly" in project)).length,
	);
	await expect(page.getByTestId("lately-empty")).toBeVisible();
});

test("fisheye demo frames exist in the build", async ({ page, request }) => {
	await page.goto("/en/");
	const demo = page.locator("[data-cam1]").first();
	for (const attr of ["data-cam1", "data-cam2"]) {
		const src = await demo.getAttribute(attr);
		expect(src).toBeTruthy();
		const response = await request.get(src as string);
		expect(response.status()).toBe(200);
	}
});
