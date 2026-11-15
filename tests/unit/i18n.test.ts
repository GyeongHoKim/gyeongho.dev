import { describe, expect, it } from "vitest";
import {
	getLocaleStaticPaths,
	isLocale,
	localePath,
	pickLocale,
	switchLocalePath,
	t,
} from "../../src/i18n";
import { ui } from "../../src/i18n/ui";

describe("pickLocale", () => {
	it.each([
		[["ko-KR", "en-US"], "ko"],
		[["en-GB"], "en"],
		[["ja-JP", "ko"], "ko"],
		[["ja-JP", "fr"], "en"],
		[[], "en"],
	])("%j -> %s", (languages, expected) => {
		expect(pickLocale(languages)).toBe(expected);
	});
});

describe("isLocale", () => {
	it("accepts only ko and en", () => {
		expect(isLocale("ko")).toBe(true);
		expect(isLocale("en")).toBe(true);
		expect(isLocale("ja")).toBe(false);
	});
});

describe("localePath", () => {
	it("adds the prefix and a trailing slash", () => {
		expect(localePath("ko")).toBe("/ko/");
		expect(localePath("en", "about")).toBe("/en/about/");
		expect(localePath("ko", "/blog/dummy/")).toBe("/ko/blog/dummy/");
		expect(localePath("ko", "about#now")).toBe("/ko/about/#now");
	});
});

describe("switchLocalePath", () => {
	it("keeps the rest of the path", () => {
		expect(switchLocalePath("/ko/blog/dummy/", "en")).toBe("/en/blog/dummy/");
		expect(switchLocalePath("/en/", "ko")).toBe("/ko/");
		expect(switchLocalePath("/", "ko")).toBe("/ko/");
	});
});

describe("getLocaleStaticPaths", () => {
	it("lists both locales", () => {
		expect(getLocaleStaticPaths()).toEqual([
			{ params: { lang: "ko" } },
			{ params: { lang: "en" } },
		]);
	});
});

describe("t", () => {
	it("has the same keys in both locales", () => {
		expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ko).sort());
	});
	it("returns the string for a locale", () => {
		expect(t("ko", "nav.menu")).toBe("메뉴");
	});
});
