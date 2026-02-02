/**
 * Dock widget — task bar for open app windows. Subscribes to window store.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import {
	type AppId,
	getOpenWindows,
	restoreApp,
	subscribeWindowStore,
} from "../../../shared/lib/window-store.js";
import { getAppConfig } from "../../../shared/lib/app-registry.js";
import "../../app-icon/ui/app-icon-widget.ts";

@customElement("dock-widget")
export class DockWidget extends LitElement {
	private unsubscribe: (() => void) | null = null;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	override connectedCallback() {
		super.connectedCallback();
		this.unsubscribe = subscribeWindowStore(() => this.requestUpdate());
	}

	override disconnectedCallback() {
		this.unsubscribe?.();
		super.disconnectedCallback();
	}

	static styles = css`
		:host {
			display: block;
		}

		.dock {
			position: fixed;
			bottom: 8px;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			gap: 8px;
			padding: 8px 12px;
			background: rgba(40, 40, 40, 0.9);
			border-radius: 12px;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		}

		.dock-item {
			width: 48px;
			height: 48px;
			border-radius: 10px;
			border: none;
			background: rgba(255, 255, 255, 0.1);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: transform 0.15s ease, background 0.15s ease;
		}

		.dock-item:hover {
			background: rgba(255, 255, 255, 0.2);
			transform: scale(1.1);
		}

		.dock-item:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.dock-item.active {
			background: rgba(53, 132, 228, 0.4);
		}

		.dock-item.minimized::after {
			content: "";
			position: absolute;
			bottom: 4px;
			width: 6px;
			height: 6px;
			background: #ffbd2e;
			border-radius: 50%;
		}
	`;

	override render() {
		const openWindows = getOpenWindows();
		const appIds = Object.keys(openWindows) as AppId[];
		if (appIds.length === 0) return null;

		return html`
			<div class="dock">
				${appIds.map((appId) =>
					this.renderDockItem(appId, openWindows[appId]?.minimized ?? false),
				)}
			</div>
		`;
	}

	private renderDockItem(appId: AppId, minimized: boolean) {
		const config = getAppConfig(appId);
		if (!config) return null;

		const ariaLabel = minimized
			? `${msg("Restore", { desc: "Dock button restore" })} ${config.label}`
			: `${msg("Window is open", { desc: "Dock button" })} ${config.label}`;

		return html`
			<button
				type="button"
				class="dock-item ${minimized ? "minimized" : "active"}"
				aria-label=${ariaLabel}
				@click=${() => restoreApp(appId)}
			>
				<app-icon-widget appId=${appId} size=${24}></app-icon-widget>
			</button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"dock-widget": DockWidget;
	}
}
