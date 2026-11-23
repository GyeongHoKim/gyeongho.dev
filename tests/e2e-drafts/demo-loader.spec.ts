import {
	expect,
	type Locator,
	type Page,
	type Route,
	test,
} from "@playwright/test";

declare global {
	interface Window {
		__showDemos: () => void;
	}
}

const POST = "/ko/blog/fisheye-dewarping-inverse-mapping/";
// A post of the drafts build that has no demo tag. When this one is deleted,
// name another post without a demo here.
const PLAIN_POST = "/ko/blog/dummy-post/";
/** The two pictures the demo shows; the fallback picture of the post is neither. */
const DEMO_PICTURES = /\/_astro\/(?:cam1|dewarped)\.[^/]+\.jpg$/;

/**
 * The post body will be rewritten, so no test may depend on where the demo
 * sits. IntersectionObserver is replaced: a demo counts as near the viewport
 * only when the test calls `showDemos`.
 */
async function holdDemos(page: Page) {
	await page.addInitScript(() => {
		type Watch = { observer: HeldObserver; target: Element };
		let watched: Watch[] = [];
		class HeldObserver {
			constructor(readonly callback: IntersectionObserverCallback) {}
			observe(target: Element) {
				watched.push({ observer: this, target });
			}
			unobserve(target: Element) {
				watched = watched.filter(
					(watch) => watch.observer !== this || watch.target !== target,
				);
			}
			disconnect() {
				watched = watched.filter((watch) => watch.observer !== this);
			}
			takeRecords() {
				return [];
			}
		}
		window.IntersectionObserver =
			HeldObserver as unknown as typeof IntersectionObserver;
		window.__showDemos = () => {
			for (const { observer, target } of [...watched]) {
				observer.callback(
					[{ isIntersecting: true, target } as IntersectionObserverEntry],
					observer as unknown as IntersectionObserver,
				);
			}
		};
	});
}

/**
 * Runs `edit` once the post body is parsed and before the loader, a module
 * script, looks for demo tags: the loader looks only once.
 */
async function editBodyBeforeLoader(page: Page, edit: () => void) {
	await page.addInitScript(`
		document.addEventListener("readystatechange", () => {
			if (document.readyState === "interactive") (${edit})();
		});
	`);
}

function showDemos(page: Page) {
	return page.evaluate(() => window.__showDemos());
}

/**
 * Takes WebGPU away, so that the demo is the same on every machine: the
 * still image and the notice, and no request for the photo besides the picture.
 */
async function withoutWebGpu(page: Page) {
	await page.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, "gpu", {
			configurable: true,
			get: () => undefined,
		});
	});
}

function demo(page: Page) {
	return page.locator("demo-fisheye-inverse");
}

function fallbackPicture(host: Locator) {
	return host.locator(":scope > :not([data-demo-stage]) img").first();
}

/** Everything the post wrote inside the tag. */
function fallback(host: Locator) {
	return host.locator(":scope > :not([data-demo-stage])");
}

/** The fallback is a picture and words; the words are not the alt of the picture. */
async function expectFallbackShown(host: Locator) {
	const picture = fallbackPicture(host);
	// The picture is loading="lazy".
	await picture.scrollIntoViewIfNeeded();
	await expect(picture).toBeVisible();
	await expect.poll(() => naturalWidth(picture)).toBeGreaterThan(0);
	await expect(host).toContainText(/\S/);
}

async function expectFallbackHidden(host: Locator) {
	const children = await fallback(host).all();
	expect(children.length).toBeGreaterThan(0);
	for (const child of children) await expect(child).toBeHidden();
}

function stage(host: Locator) {
	return host.locator(":scope > [data-demo-stage]");
}

function naturalWidth(picture: Locator) {
	return picture.evaluate((img: HTMLImageElement) => img.naturalWidth);
}

/**
 * The selectors of the demo's own rules (its classes start with "fi-") in the
 * style sheets of the page, linked or inline.
 */
function demoStyleRules(page: Page) {
	return page.evaluate(() => {
		const found: string[] = [];
		const walk = (rules: CSSRuleList) => {
			for (const rule of rules) {
				if (rule instanceof CSSStyleRule && rule.selectorText.includes(".fi-"))
					found.push(rule.selectorText);
				if ("cssRules" in rule) walk(rule.cssRules as CSSRuleList);
			}
		};
		for (const sheet of document.styleSheets) walk(sheet.cssRules);
		return found;
	});
}

async function height(host: Locator) {
	const box = await host.boundingBox();
	if (!box) throw new Error("the demo tag has no box");
	return box.height;
}

/** How much taller the tag is than what it shows: the room it keeps for nothing. */
function emptyRoom(host: Locator) {
	return host.evaluate((element) => {
		const boxes = [...element.children]
			.map((child) => child.getBoundingClientRect())
			.filter((box) => box.height > 0);
		const top = Math.min(...boxes.map((box) => box.top));
		const bottom = Math.max(...boxes.map((box) => box.bottom));
		return element.getBoundingClientRect().height - (bottom - top);
	});
}

function frames(page: Page, count = 2) {
	return page.evaluate(async (count) => {
		for (let i = 0; i < count; i++)
			await new Promise((resolve) => requestAnimationFrame(resolve));
	}, count);
}

test("fallback shows until the demo is near the viewport", async ({ page }) => {
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);

	await expect(host).not.toHaveAttribute("data-demo-state");
	await expectFallbackShown(host);
	await expect(stage(host)).toHaveCount(0);

	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	await expectFallbackHidden(host);
	await expect(stage(host)).toBeVisible();
});

test("the real observer loads a demo only when it comes near", async ({
	page,
}) => {
	await withoutWebGpu(page);
	// Wherever the post has its demo, it now starts far below the first screen.
	await editBodyBeforeLoader(page, () => {
		const spacer = document.createElement("div");
		spacer.style.blockSize = "4000px";
		document.querySelector("demo-fisheye-inverse")?.before(spacer);
	});
	await page.goto(POST);
	const host = demo(page);
	const scrollTo = async (below: number) => {
		// `below`: how far under the bottom edge of the viewport the tag starts.
		await host.evaluate((element, below) => {
			const top = element.getBoundingClientRect().top + window.scrollY;
			window.scrollTo({
				top: top - window.innerHeight - below,
				behavior: "instant",
			});
		}, below);
		await frames(page, 3);
	};

	await page.waitForLoadState("networkidle");
	await frames(page, 3);
	await expect(host).not.toHaveAttribute("data-demo-state");
	await scrollTo(1000);
	await expect(host).not.toHaveAttribute("data-demo-state");
	await expect(stage(host)).toHaveCount(0);

	// Still under the viewport, and inside the margin of the loader.
	await scrollTo(300);
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	await expect(stage(host)).toHaveCount(1);

	// Leaving and coming back does not load it again.
	for (let i = 0; i < 2; i++) {
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
		await frames(page, 3);
		await scrollTo(-100);
	}
	await expect(stage(host)).toHaveCount(1);
});

test("the demo keeps the height that was reserved", async ({ page }) => {
	// The notice is the tallest state of the demo, and every machine shows it.
	await withoutWebGpu(page);
	await holdDemos(page);
	const own = page.viewportSize() ?? { width: 1440, height: 900 };
	// 320 is the narrowest phone and 640 the widest stacked layout, where the
	// rows wrap the least; 641 and 700 are the narrowest side-by-side layouts,
	// where the rows under the panes wrap the most.
	for (const width of [own.width, 320, 640, 641, 700]) {
		await page.setViewportSize({ width, height: own.height });
		await page.goto(POST);
		const host = demo(page);
		const before = await height(host);

		await showDemos(page);
		await expect(host).toHaveAttribute("data-demo-state", "ready");
		const after = await height(host);
		expect(Math.abs(after - before), `at ${width}px`).toBeLessThanOrEqual(1);
		// Not much more than the demo needs either: the room left under it.
		expect(after - (await height(stage(host))), `at ${width}px`).toBeLessThan(
			80,
		);
	}
});

test("the fallback stays until the demo's pictures have loaded", async ({
	page,
}) => {
	await withoutWebGpu(page);
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);
	await expectFallbackShown(host);
	const before = await height(host);

	const held: Route[] = [];
	await page.route(DEMO_PICTURES, (route) => {
		held.push(route);
	});
	await showDemos(page);
	await expect.poll(() => held.length).toBe(2);
	await frames(page);
	// The demo is laid out for its pictures, invisible and without taking room.
	await expect(host).toHaveAttribute("data-demo-state", "loading");
	await expect(fallbackPicture(host)).toBeVisible();
	await expect(stage(host)).toHaveCount(1);
	await expect(stage(host)).toBeHidden();
	expect(Math.abs((await height(host)) - before)).toBeLessThanOrEqual(1);
	const hostBox = await host.boundingBox();
	const stageBox = await stage(host).boundingBox();
	expect(Math.abs((stageBox?.y ?? 0) - (hostBox?.y ?? -1))).toBeLessThanOrEqual(
		1,
	);
	expect(stageBox?.width).toBe(hostBox?.width);

	for (const route of held) await route.continue();
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	// Ready means the pictures are there, not on their way.
	expect(
		await stage(host)
			.locator("img")
			.evaluateAll((images: HTMLImageElement[]) =>
				images.map((image) => image.complete && image.naturalWidth > 0),
			),
	).toEqual([true, true]);
	await expectFallbackHidden(host);
});

test("a demo whose pictures cannot be loaded keeps its fallback", async ({
	page,
}) => {
	await withoutWebGpu(page);
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);
	await expectFallbackShown(host);

	await page.route(DEMO_PICTURES, (route) => route.abort());
	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "failed");
	await expectFallbackShown(host);
	await expect(stage(host)).toHaveCount(0);
	expect(await emptyRoom(host)).toBeLessThanOrEqual(1);
});

test("a failing demo keeps its fallback", async ({ page }) => {
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);

	await page.route("**/*.js", (route) => route.abort());
	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "failed");
	await expectFallbackShown(host);
	await expect(stage(host)).toHaveCount(0);
	await expect(page.locator("h1")).toBeVisible();
	// A failed demo gives back the height that was reserved for it.
	expect(await emptyRoom(host)).toBeLessThanOrEqual(1);
});

test("a demo whose mount throws leaves no stage behind", async ({ page }) => {
	// mount() has built its DOM in the stage by the time it needs this.
	await page.addInitScript(() => {
		window.ResizeObserver = class {
			constructor() {
				throw new Error("mount fails");
			}
		} as unknown as typeof ResizeObserver;
	});
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);

	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "failed");
	await expect(stage(host)).toHaveCount(0);
	await expectFallbackShown(host);
	expect(await emptyRoom(host)).toBeLessThanOrEqual(1);
});

test("the demo speaks the language of the page", async ({ page }) => {
	await holdDemos(page);
	await editBodyBeforeLoader(page, () => {
		document.documentElement.lang = "en";
	});
	await page.goto(POST);
	const host = demo(page);

	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	await expect(host.locator('[data-pane="source"] figcaption')).toHaveText(
		"Original",
	);
	await expect(host.locator('[data-pane="view"] figcaption')).toHaveText(
		"Dewarped view",
	);
});

test("unknown demo tag", async ({ page }) => {
	await holdDemos(page);
	await editBodyBeforeLoader(page, () => {
		const unknown = document.createElement("demo-nope");
		unknown.textContent = "대체";
		document.querySelector(".prose")?.append(unknown);
	});
	await page.goto(POST);
	const unknown = page.locator("demo-nope");
	await expect(unknown).toHaveCount(1);

	await showDemos(page);
	await expect(unknown).toHaveAttribute("data-demo-state", "failed");
	await expect(unknown).toHaveText("대체");
	await expect(unknown).toBeVisible();
	await expect(demo(page)).toHaveAttribute("data-demo-state", "ready");
});

test("two demos on one page", async ({ page }) => {
	await holdDemos(page);
	await editBodyBeforeLoader(page, () => {
		const host = document.querySelector("demo-fisheye-inverse");
		host?.after(host.cloneNode(true));
	});
	await page.goto(POST);
	const hosts = demo(page);
	await expect(hosts).toHaveCount(2);

	await showDemos(page);
	for (const host of await hosts.all()) {
		await expect(host).toHaveAttribute("data-demo-state", "ready");
		await expect(stage(host)).toHaveCount(1);
		await expect(stage(host)).toBeVisible();
		await expect(fallbackPicture(host)).toBeHidden();
	}

	// A demo is loaded once, even if the observer reports its tag again.
	await showDemos(page);
	await frames(page);
	for (const host of await hosts.all()) {
		await expect(host).toHaveAttribute("data-demo-state", "ready");
		await expect(stage(host)).toHaveCount(1);
	}
});

test("a post without demos requests no demo code", async ({ page }) => {
	// The plain post goes first, with the real IntersectionObserver and nothing cached.
	const plainRequests = new Set<string>();
	const collectPlain = (request: { url(): string }) =>
		plainRequests.add(request.url());
	page.on("request", collectPlain);
	// On a missing page the rest of this half would pass without a post.
	const response = await page.goto(PLAIN_POST);
	expect(response?.status()).toBe(200);
	await expect(page.locator("article.post")).toHaveCount(1);
	await expect(demo(page)).toHaveCount(0);
	await page.evaluate(async () => {
		const end = () => document.documentElement.scrollHeight;
		for (let y = 0; y < end(); y += window.innerHeight) {
			window.scrollTo(0, y);
			await new Promise(requestAnimationFrame);
		}
		window.scrollTo(0, end());
	});
	await page.waitForLoadState("networkidle");
	page.off("request", collectPlain);
	expect(plainRequests.size).toBeGreaterThan(0);
	// The demo's style sheet must not ride along in the CSS of the page.
	expect(await demoStyleRules(page)).toEqual([]);

	// What the demo post asks for from the moment its demo comes near.
	await holdDemos(page);
	await page.goto(POST);
	const host = demo(page);
	const demoRequests = new Set<string>();
	page.on("request", (request) => {
		if (/\.(js|jpg)$/.test(new URL(request.url()).pathname))
			demoRequests.add(request.url());
	});
	await showDemos(page);
	await expect(host).toHaveAttribute("data-demo-state", "ready");
	await expect
		.poll(() =>
			stage(host)
				.locator("img")
				.evaluateAll((images: HTMLImageElement[]) =>
					images.every((image) => image.complete && image.naturalWidth > 0),
				),
		)
		.toBe(true);

	expect([...demoRequests].some((url) => url.endsWith(".js"))).toBe(true);
	expect([...demoRequests].some((url) => url.endsWith(".jpg"))).toBe(true);
	// The demo does bring such rules, so the check on the plain post can fail.
	expect(await demoStyleRules(page)).not.toEqual([]);
	expect([...demoRequests].filter((url) => plainRequests.has(url))).toEqual([]);
});

test.describe("without JavaScript", () => {
	test.use({ javaScriptEnabled: false });

	test("the fallback is readable without JavaScript", async ({ page }) => {
		await page.goto(POST);
		const host = demo(page);

		await expectFallbackShown(host);
		await expect(host).not.toHaveAttribute("data-demo-state");
		// Without scripting no height is reserved for a demo that never comes.
		expect(await emptyRoom(host)).toBeLessThanOrEqual(1);
	});
});

test("no horizontal scroll", async ({ page }) => {
	await holdDemos(page);
	await page.goto(POST);
	await showDemos(page);
	await expect(demo(page)).toHaveAttribute("data-demo-state", "ready");

	const overflow = await page.evaluate(
		() =>
			document.documentElement.scrollWidth -
			document.documentElement.clientWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
});
