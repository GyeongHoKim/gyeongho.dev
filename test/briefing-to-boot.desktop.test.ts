import { expect } from "@esm-bundle/chai";

import { setBriefingSeen } from "../src/shared/lib/briefing-store.js";
import { createAppRouter } from "../src/app/lib/router/app-router.js";

async function waitFor<T>(
	fn: () => T | null | undefined,
	timeoutMs = 4000,
	intervalMs = 25,
): Promise<T> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const value = fn();
		if (value) return value;
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}
	throw new Error("waitFor timeout");
}

// Lightweight E2E test using the app-router and shadow DOM
describe("Mission briefing -> boot flow", () => {
	it("navigates to boot page after accepting briefing", async function () {
		this.timeout(10000);
		// Reset deterministic start state
		setBriefingSeen(false);
		window.location.hash = "";
		document.body.innerHTML = "";

		// Mount a minimal app root and router outlet
		const root = document.createElement("div");
		root.id = "root";
		const outlet = document.createElement("div");
		outlet.id = "router-outlet";
		root.appendChild(outlet);
		document.body.appendChild(root);

		// Create the app router attached to the outlet
		const dispose = createAppRouter(outlet);

		// Navigate to the mission briefing route
		window.location.hash = "#/desktop/briefing";

		const briefingEl = await waitFor(
			() => outlet.querySelector("mission-briefing") as HTMLElement | null,
		);
		const acceptBtn = await waitFor(
			() =>
				(
					briefingEl as { shadowRoot?: ShadowRoot | null }
				).shadowRoot?.querySelector(".accept-btn") as HTMLElement | null,
		);
		expect(acceptBtn).to.exist;

		// Click Accept mission inside shadow DOM
		acceptBtn.click();

		await waitFor(() =>
			/#\/desktop\/boot/.test(window.location.hash) ? true : null,
		);
		const bootEl = await waitFor(
			() => outlet.querySelector("boot-page") as HTMLElement | null,
		);
		expect(bootEl).to.exist;

		// Cleanup
		dispose?.();
	});
});
