import type { GhToggle } from "@ghds/web-components/toggle";

export interface BlogFilter {
	tag: string;
	series: string;
}

export const ALL = "all";

/** A post is shown when it matches the chosen tag and the chosen series. */
export function matchesFilter(
	post: { tags: readonly string[]; series?: string },
	filter: BlogFilter,
): boolean {
	return (
		(filter.tag === ALL || post.tags.includes(filter.tag)) &&
		(filter.series === ALL || post.series === filter.series)
	);
}

/**
 * Narrows the post list by tag (gh-toggle group, one is always pressed) and by
 * series (buttons in the Series note, pressing the current one clears it).
 */
export function initBlogFilter(root: HTMLElement): void {
	const toggles = root.querySelectorAll<GhToggle>("[data-tag-filter]");
	const seriesButtons = root.querySelectorAll<HTMLButtonElement>(
		"[data-series-filter]",
	);
	const posts = root.querySelectorAll<HTMLElement>("[data-post]");
	const years = root.querySelectorAll<HTMLElement>("[data-year]");
	const none = root.querySelector<HTMLElement>("[data-filter-none]");
	const filter: BlogFilter = { tag: ALL, series: ALL };

	const apply = () => {
		let shown = 0;
		for (const post of posts) {
			const match = matchesFilter(
				{
					tags: JSON.parse(post.dataset.tags ?? "[]") as string[],
					series: post.dataset.series,
				},
				filter,
			);
			post.hidden = !match;
			if (match) shown += 1;
		}
		for (const year of years) {
			year.hidden = year.querySelector("[data-post]:not([hidden])") === null;
		}
		if (none) none.hidden = shown > 0;
		for (const toggle of toggles) {
			toggle.pressed = toggle.dataset.tagFilter === filter.tag;
		}
		for (const button of seriesButtons) {
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.seriesFilter === filter.series),
			);
		}
	};

	for (const toggle of toggles) {
		toggle.addEventListener("change", () => {
			filter.tag = toggle.dataset.tagFilter ?? ALL;
			apply();
		});
	}
	for (const button of seriesButtons) {
		button.addEventListener("click", () => {
			const name = button.dataset.seriesFilter ?? ALL;
			filter.series = filter.series === name ? ALL : name;
			apply();
		});
	}
}
