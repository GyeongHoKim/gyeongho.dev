import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Locale } from "../i18n";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const COPY: Record<
	Locale,
	{ title: string; description: string; body: string }
> = {
	ko: { title: "[제목]", description: "[한 문장 요약]", body: "[본문]" },
	en: {
		title: "[Title]",
		description: "[One-sentence summary]",
		body: "[Body]",
	},
};

/** A slug is lowercase letters and digits, in words joined by single hyphens. */
export function isValidSlug(slug: string): boolean {
	return SLUG.test(slug);
}

/** Where the post of a slug and locale lives, relative to the repository root. */
export function postFilePath(slug: string, locale: Locale): string {
	return `src/content/blog/${locale}/${slug}.md`;
}

/** The starting text of a post: a draft dated the local day of `date`, with placeholder copy. */
export function postTemplate(locale: Locale, date: Date): string {
	const { title, description, body } = COPY[locale];
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `---
title: "${title}"
description: "${description}"
pubDate: ${year}-${month}-${day}
tags: []
# series: "FishEye"
draft: true
---

${body}
`;
}

/** Why createPost() wrote nothing; the message is for the writer. */
export class NewPostError extends Error {}

function isCopyLocale(locale: string): locale is Locale {
	return Object.hasOwn(COPY, locale);
}

/**
 * Writes the starting text of a post under `root`, the repository root, and
 * returns the path of the file relative to it. A file that is already there
 * is never overwritten.
 */
export async function createPost(
	root: string,
	slug: string,
	locale: string,
	date: Date,
): Promise<string> {
	if (!isValidSlug(slug))
		throw new NewPostError(
			`"${slug}" is not a slug (lowercase words joined by hyphens)`,
		);
	if (!isCopyLocale(locale))
		throw new NewPostError(`"${locale}" is not a language (ko or en)`);
	const file = postFilePath(slug, locale);
	const target = join(root, file);
	await mkdir(dirname(target), { recursive: true });
	try {
		await writeFile(target, postTemplate(locale, date), { flag: "wx" });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
		throw new NewPostError(`${file} already exists`);
	}
	return file;
}
