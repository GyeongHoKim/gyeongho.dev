import { expect } from "@esm-bundle/chai";

import "../src/widgets/floating-window/ui/floating-window.ts";

async function nextFrame(): Promise<void> {
	await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
}

class TestWindowApp extends HTMLElement {
	connectedCallback(): void {
		if (this.shadowRoot) return;
		const root = this.attachShadow({ mode: "open" });
		const windowEl = document.createElement("floating-window");
		const title = this.getAttribute("title") ?? "";
		windowEl.setAttribute("title", title);
		const content = document.createElement("div");
		content.setAttribute("slot", "content");
		content.textContent = "content";
		windowEl.appendChild(content);
		root.appendChild(windowEl);
	}
}

if (!customElements.get("test-window-app")) {
	customElements.define("test-window-app", TestWindowApp);
}

function createWindowContainer(id: string): HTMLDivElement {
	const container = document.createElement("div");
	container.setAttribute("data-app-id", id);
	Object.assign(container.style, {
		position: "absolute",
		top: "140px",
		left: "160px",
	});
	return container;
}

function applyZIndex(
	order: string[],
	containers: Record<string, HTMLElement>,
): void {
	for (const [id, container] of Object.entries(containers)) {
		const idx = order.indexOf(id);
		container.style.zIndex = String(idx === -1 ? 0 : 10 + idx);
	}
}

describe("Floating window focus after drag", () => {
	it("clicking the old titlebar position focuses the window underneath", async function () {
		this.timeout(8000);
		document.body.innerHTML = "";
		document.body.style.margin = "0";

		const root = document.createElement("div");
		Object.assign(root.style, {
			position: "relative",
			width: "1200px",
			height: "800px",
		});
		document.body.appendChild(root);

		const terminalContainer = createWindowContainer("terminal");
		const browserContainer = createWindowContainer("browser");
		root.appendChild(browserContainer);
		root.appendChild(terminalContainer);

		const terminalApp = document.createElement("test-window-app");
		terminalApp.setAttribute("title", "Terminal");
		const browserApp = document.createElement("test-window-app");
		browserApp.setAttribute("title", "Browser");
		terminalApp.style.display = "block";
		browserApp.style.display = "block";
		terminalContainer.appendChild(terminalApp);
		browserContainer.appendChild(browserApp);

		const containers = { terminal: terminalContainer, browser: browserContainer };
		const zOrder = ["browser", "terminal"];
		applyZIndex(zOrder, containers);

		root.addEventListener("window-focus", (e: Event) => {
			const target = (e.target as HTMLElement).closest("[data-app-id]");
			const id = target?.getAttribute("data-app-id");
			if (!id) return;
			const idx = zOrder.indexOf(id);
			if (idx !== -1) {
				zOrder.splice(idx, 1);
				zOrder.push(id);
				applyZIndex(zOrder, containers);
			}
		});
		root.addEventListener("window-drag", (e: Event) => {
			const target = (e.target as HTMLElement).closest("[data-app-id]");
			const id = target?.getAttribute("data-app-id");
			if (!id) return;
			const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
			const container = containers[id as "terminal" | "browser"];
			if (!container) return;
			container.style.transform = `translate(${detail.x}px, ${detail.y}px)`;
		});

		const terminalWindow =
			(terminalApp.shadowRoot?.querySelector(
				"floating-window",
			) as HTMLElement | null) ?? null;
		expect(terminalWindow).to.exist;
		const browserWindow =
			(browserApp.shadowRoot?.querySelector(
				"floating-window",
			) as HTMLElement | null) ?? null;
		expect(browserWindow).to.exist;
		await (terminalWindow as HTMLElement & { updateComplete?: Promise<void> })
			.updateComplete;
		await (browserWindow as HTMLElement & { updateComplete?: Promise<void> })
			.updateComplete;
		await nextFrame();

		const titleBar =
			(terminalWindow as HTMLElement & { shadowRoot?: ShadowRoot | null })
				.shadowRoot?.querySelector(".title-bar") as HTMLElement | null;
		expect(titleBar).to.exist;
		const browserTitleBar =
			(browserWindow as HTMLElement & { shadowRoot?: ShadowRoot | null })
				.shadowRoot?.querySelector(".title-bar") as HTMLElement | null;
		expect(browserTitleBar).to.exist;

		const startRect = titleBar.getBoundingClientRect();
		const startX = Math.round(startRect.left + startRect.width / 2);
		const startY = Math.round(startRect.top + startRect.height / 2);
		const dragDeltaX = Math.round(startRect.width + 40);
		const dragDeltaY = 80;

		titleBar.dispatchEvent(
			new MouseEvent("mousedown", {
				bubbles: true,
				composed: true,
				clientX: startX,
				clientY: startY,
			}),
		);
		document.dispatchEvent(
			new MouseEvent("mousemove", {
				bubbles: true,
				buttons: 1,
				clientX: startX + dragDeltaX,
				clientY: startY + dragDeltaY,
			}),
		);
		document.dispatchEvent(
			new MouseEvent("mouseup", {
				bubbles: true,
				clientX: startX + dragDeltaX,
				clientY: startY + dragDeltaY,
			}),
		);

		await (terminalWindow as HTMLElement & { updateComplete?: Promise<void> })
			.updateComplete;
		await nextFrame();

		const endRect = titleBar.getBoundingClientRect();
		expect(endRect.left).to.be.greaterThan(
			startRect.left + startRect.width / 2,
		);

		const hit = document.elementFromPoint(startX, startY) as HTMLElement | null;
		expect(hit).to.exist;
		const hitAppId = hit
			?.closest("[data-app-id]")
			?.getAttribute("data-app-id");
		expect(hitAppId).to.equal("browser");

		browserTitleBar.dispatchEvent(
			new MouseEvent("mousedown", {
				bubbles: true,
				composed: true,
				clientX: startX,
				clientY: startY,
			}),
		);
		browserTitleBar.dispatchEvent(
			new MouseEvent("mouseup", {
				bubbles: true,
				composed: true,
				clientX: startX,
				clientY: startY,
			}),
		);

		expect(zOrder[zOrder.length - 1]).to.equal("browser");
	});
});
