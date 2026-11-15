import { expect, test } from "@playwright/test";

test("renders the PDF and switches language without navigating", async ({
	page,
}) => {
	await page.goto("/ko/resume/");
	const viewer = page.locator("[data-resume-viewer]");
	await expect(viewer).toHaveAttribute("data-resume-locale", "ko");
	await expect(viewer.locator("canvas").first()).toBeVisible();
	await expect(page.getByTestId("resume-missing")).toHaveCount(0);
	await expect(page.getByTestId("resume-download")).toHaveAttribute(
		"href",
		"/resume/resume-ko.pdf",
	);

	await page.getByRole("button", { name: "English" }).click();
	await expect(viewer).toHaveAttribute("data-resume-locale", "en");
	await expect(page).toHaveURL(/\/ko\/resume\/$/);
	await expect(page.getByTestId("resume-download")).toHaveAttribute(
		"href",
		"/resume/resume-en.pdf",
	);
	await expect(viewer.locator("canvas").first()).toBeVisible();
});

test("renders the English PDF on /en/resume/", async ({ page }) => {
	await page.goto("/en/resume/");
	await expect(page.locator("[data-resume-viewer]")).toHaveAttribute(
		"data-resume-locale",
		"en",
	);
	await expect(
		page.locator("[data-resume-viewer] canvas").first(),
	).toBeVisible();
});

test("a quick ko -> en -> ko switch renders each page once", async ({
	page,
}) => {
	await page.goto("/ko/resume/");
	const viewer = page.locator("[data-resume-viewer]");
	await expect(viewer.locator("canvas").first()).toBeVisible();
	let previous = -1;
	await expect
		.poll(async () => {
			const now = await viewer.locator("canvas").count();
			const stable = now > 0 && now === previous;
			previous = now;
			return stable;
		})
		.toBe(true);
	const count = await viewer.locator("canvas").count();
	await page.getByRole("button", { name: "English" }).click();
	await page.getByRole("button", { name: "한국어" }).click();
	await expect(viewer).toHaveAttribute("data-resume-locale", "ko");
	await expect(viewer.locator("canvas").first()).toBeVisible();
	await expect(viewer.locator("canvas")).toHaveCount(count);
	previous = -1;
	await expect
		.poll(async () => {
			const now = await viewer.locator("canvas").count();
			const stable = now === previous;
			previous = now;
			return stable;
		})
		.toBe(true);
	await expect(viewer.locator("canvas")).toHaveCount(count);
});
