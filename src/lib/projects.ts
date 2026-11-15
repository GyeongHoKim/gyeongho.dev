import { z } from "astro/zod";
import data from "../data/projects.json";
import type { Locale } from "../i18n";

const localized = z.object({ ko: z.string().min(1), en: z.string().min(1) });

/** An absolute URL, or a site path such as "/portfolio/" that gets the locale prefix (not already prefixed). */
const href = z.union(
	[
		z.url({ protocol: /^https?$/ }),
		z.string().regex(/^\/(?!\/|(?:ko|en)(?:\/|$))/),
	],
	{
		error: "href must be an absolute URL or a site path starting with /",
	},
);

const projectSchema = z.object({
	name: z.string().min(1),
	description: localized,
	tags: z.array(z.string().min(1)),
	links: z.array(z.object({ label: localized, href })).min(1),
});

export type Project = {
	name: string;
	description: Record<Locale, string>;
	tags: string[];
	links: { label: Record<Locale, string>; href: string }[];
};

/** Throws an Error naming the project index and the field that is wrong. */
export function parseProjects(input: unknown): Project[] {
	const result = z.array(projectSchema).safeParse(input);
	if (result.success) return result.data;
	const lines = result.error.issues.map((issue) => {
		const [index, ...field] = issue.path;
		return `projects[${String(index)}].${field.join(".")}: ${issue.message}`;
	});
	throw new Error(`Invalid projects data\n${lines.join("\n")}`);
}

export const projects: Project[] = parseProjects(data);
