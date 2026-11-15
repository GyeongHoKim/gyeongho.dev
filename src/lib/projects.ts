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

const localizedList = z.object({
	ko: z.array(z.string().min(1)).min(1),
	en: z.array(z.string().min(1)).min(1),
});

/** Hand-built panels, each a component in src/components/portfolio/. */
export const CUSTOM_PANELS = ["wipe", "ghds"] as const;
export type CustomPanel = (typeof CUSTOM_PANELS)[number];

/** A file name inside src/assets/portfolio/, without any folder. */
const fileName = (extensions: string, example: string) =>
	z.string().regex(new RegExp(`^[\\w.-]+\\.(?:${extensions})$`, "i"), {
		error: `must be a file name in src/assets/portfolio/ such as "${example}"`,
	});
const imageFile = fileName("jpe?g|png|webp|avif", "screen.png");
const videoFile = fileName("mp4|webm", "screen.mp4");

/**
 * The screen Portfolio shows next to a project. A project without one gets the
 * "on its way" panel. Reach for "custom" only when no file can show the work.
 */
const mediaSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("image"), src: imageFile, alt: localized }),
	z.object({
		kind: z.literal("video"),
		src: videoFile,
		poster: imageFile.optional(),
		/** Says what the recording shows, for people who cannot see it. */
		label: localized,
	}),
	z.object({
		kind: z.literal("flow"),
		flow: localizedList,
		highlight: z.number().int().nonnegative(),
	}),
	z.object({ kind: z.literal("custom"), component: z.enum(CUSTOM_PANELS) }),
]);

const projectSchema = z
	.object({
		name: localized,
		description: localized,
		tags: z.object({
			ko: z.array(z.string().min(1)),
			en: z.array(z.string().min(1)),
		}),
		links: z.array(z.object({ label: localized, href })),
		// Shown in Portfolio but not among the Home cards; may have no links.
		portfolioOnly: z.boolean().optional(),
		// Portfolio only. Home ignores them.
		chapter: z.enum(["company", "oss"]).optional(),
		detail: localized.optional(),
		did: localizedList.optional(),
		address: z.string().min(1).optional(),
		media: mediaSchema.optional(),
	})
	.refine((project) => project.portfolioOnly || project.links.length > 0, {
		path: ["links"],
		error: "links needs at least one item",
	});

export type ProjectMedia = z.infer<typeof mediaSchema>;

export type Project = {
	name: Record<Locale, string>;
	description: Record<Locale, string>;
	tags: Record<Locale, string[]>;
	links: { label: Record<Locale, string>; href: string }[];
	/** Listed in Portfolio only, not among the Home cards. */
	portfolioOnly?: boolean;
	/** Which Portfolio heading the project is listed under. */
	chapter?: "company" | "oss";
	/** Longer text for Portfolio. Falls back to `description`. */
	detail?: Record<Locale, string>;
	/** Bullet points of what I did, shown in Portfolio. */
	did?: Record<Locale, string[]>;
	/** Text in the address bar of the Portfolio screen. Falls back to `name`. */
	address?: string;
	/** The screen shown beside the project in Portfolio. */
	media?: ProjectMedia;
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

/** The projects shown as cards on Home. */
export const homeProjects: Project[] = projects.filter(
	(project) => !project.portfolioOnly,
);
