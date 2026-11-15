import { expect, test } from "@playwright/test";

const paths = [
	"",
	"about/",
	"portfolio/",
	"talks/",
	"resume/",
	"blog/",
	"rss/",
	"guestbook/",
	"uses/",
	"colophon/",
];
for (const lang of ["ko", "en"] as const) {
	for (const path of paths) {
		test(`/${lang}/${path} has no horizontal scroll and no errors`, async ({
			page,
		}) => {
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));
			await page.goto(`/${lang}/${path}`);
			const overflow = await page.evaluate(
				() =>
					document.documentElement.scrollWidth -
					document.documentElement.clientWidth,
			);
			expect(overflow).toBeLessThanOrEqual(0);
			await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
			expect(errors).toEqual([]);
		});
	}
}
