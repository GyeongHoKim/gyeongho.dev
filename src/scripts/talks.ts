import type { GhToaster } from "@ghds/web-components/toaster";
import type { GhToggle } from "@ghds/web-components/toggle";

/**
 * Narrows the talk list by type. The filters are gh-toggle elements used as a
 * single-select group: the current one is always pressed, so it never empties.
 */
export function initTalkFilter(root: HTMLElement): void {
	const toggles = root.querySelectorAll<GhToggle>("[data-filter]");
	const items = root.querySelectorAll<HTMLElement>("[data-type]");
	for (const toggle of toggles) {
		toggle.addEventListener("change", () => {
			const filter = toggle.dataset.filter;
			for (const other of toggles) other.pressed = other === toggle;
			for (const item of items) {
				item.hidden = filter !== "all" && item.dataset.type !== filter;
			}
		});
	}
}

/** Slides under confidentiality review raise a toast instead of downloading. */
export function initReviewToast(
	toaster: GhToaster,
	triggers: Iterable<HTMLElement>,
): void {
	for (const trigger of triggers) {
		trigger.addEventListener("click", (event) => {
			event.preventDefault();
			toaster.show({
				message: trigger.dataset.message ?? "",
				variant: "info",
				duration: 4000,
			});
		});
	}
}
