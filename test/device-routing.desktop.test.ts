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

function mountRouterOutlet(): { outlet: HTMLElement; dispose: () => void } {
	const root = document.createElement("div");
	root.id = "root";
	const outlet = document.createElement("div");
	outlet.id = "router-outlet";
	root.appendChild(outlet);
	document.body.appendChild(root);
	return { outlet, dispose: createAppRouter(outlet) };
}

describe("Device-based routing (desktop)", () => {
	it("routes to desktop briefing on wide viewport", async function () {
		this.timeout(10000);
		setBriefingSeen(false);
		window.location.hash = "";
		document.body.innerHTML = "";

		const { dispose } = mountRouterOutlet();

		await waitFor(() =>
			/#\/desktop\/briefing/.test(window.location.hash) ? true : null,
		);

		dispose?.();
	});
});
