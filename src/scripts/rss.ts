import type { GhButton } from "@ghds/web-components/button";

/**
 * Copies the text of `source` to the clipboard when `button` is pressed, then
 * shows a short confirmation (or, when the clipboard is unavailable, selects the text and asks for a manual copy) in `note` (a live region) and on the button.
 */
export function initCopy(
	button: GhButton,
	source: HTMLElement,
	note: HTMLElement,
	labels: { done: string; note: string; fail: string },
): void {
	const idle = button.textContent;
	button.addEventListener("click", async () => {
		try {
			await navigator.clipboard.writeText(source.textContent ?? "");
		} catch {
			getSelection()?.selectAllChildren(source);
			note.textContent = labels.fail;
			return;
		}
		button.textContent = labels.done;
		note.textContent = labels.note;
		setTimeout(() => {
			button.textContent = idle;
		}, 3000);
	});
}
