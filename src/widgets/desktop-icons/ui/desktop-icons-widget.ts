/**
 * Desktop icons widget — grid of app icons on desktop. Double-click launches app.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { updateWhenLocaleChanges } from "@lit/localize";
import { type AppId, openApp } from "../../../shared/lib/window-store.js";
import {
	getDesktopAppIds,
	getAppConfig,
} from "../../../shared/lib/app-registry.js";
import "../../app-icon/ui/app-icon-widget.ts";

@customElement("desktop-icons-widget")
export class DesktopIconsWidget extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			padding: 24px;
		}

		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
			gap: 16px;
			max-width: 400px;
		}

		.icon-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 12px 8px;
			border: none;
			background: transparent;
			border-radius: 8px;
			cursor: pointer;
			color: rgba(255, 255, 255, 0.9);
			font-size: 12px;
			font-family: inherit;
			text-align: center;
			transition: background 0.15s ease;
		}

		.icon-item:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		.icon-item:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.icon-item app-icon-widget {
			display: block;
		}
	`;

	override render() {
		const appIds = getDesktopAppIds();
		if (appIds.length === 0) return null;

		return html`
			<div class="grid">
				${appIds.map((appId) => this.renderIconItem(appId))}
			</div>
		`;
	}

	private renderIconItem(appId: AppId) {
		const config = getAppConfig(appId);
		if (!config) return null;
		if (!config.icon && !config.iconSvg) return null;

		const ariaLabel = `${config.label}, double-click to open`;

		return html`
			<button
				type="button"
				class="icon-item"
				aria-label=${ariaLabel}
				@dblclick=${() => openApp(appId)}
			>
				<app-icon-widget
					appId=${appId}
					size=${48}
					showLabel
				></app-icon-widget>
			</button>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"desktop-icons-widget": DesktopIconsWidget;
	}
}
