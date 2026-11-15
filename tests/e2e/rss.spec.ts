import { expect, test } from "@playwright/test";

for (const lang of ["ko", "en"] as const) {
	test(`${lang} feed is valid RSS with the right language`, async ({
		request,
	}) => {
		const response = await request.get(`/${lang}/feed.xml`);
		expect(response.headers()["content-type"]).toContain("xml");
		const body = await response.text();
		expect(body).toContain("<rss");
		expect(body).toContain(`<language>${lang}</language>`);
		expect(body).toContain(`<link>https://gyeongho.dev/${lang}/</link>`);
	});
}

for (const lang of ["ko", "en"] as const) {
	test(`production ${lang} feed excludes the draft sample post`, async ({
		request,
	}) => {
		const body = await (await request.get(`/${lang}/feed.xml`)).text();
		expect(body).not.toContain("dummy-post");
	});

	test(`${lang} rss page offers exactly the two feeds and no video feed`, async ({
		page,
	}) => {
		await page.goto(`/${lang}/rss/`);
		const hrefs = await page
			.locator("#feeds a[href$='feed.xml']")
			.evaluateAll((links) => links.map((a) => a.getAttribute("href")));
		expect(hrefs.sort()).toEqual(["/en/feed.xml", "/ko/feed.xml"]);
		await expect(page.locator("#blogroll li")).not.toHaveCount(0);
		await expect(page.locator("#buttons")).toBeVisible();
	});
}
