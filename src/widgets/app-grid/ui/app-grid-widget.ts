/**
 * App Grid Widget
 *
 * Grid of application shortcuts (Terminal, Browser, Files, Settings).
 * Dispatches open-terminal, open-browser. Used by menu-widget.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "iconify-icon";

@customElement("app-grid-widget")
export class AppGridWidget extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.search-box {
			width: 100%;
			padding: 12px 16px;
			background: rgba(255, 255, 255, 0.1);
			border: none;
			border-radius: 8px;
			color: #fff;
			font-size: 16px;
			margin-bottom: 24px;
			box-sizing: border-box;
		}

		.search-box::placeholder {
			color: rgba(255, 255, 255, 0.5);
		}

		.search-box:focus {
			outline: 2px solid #3584e4;
			outline-offset: -2px;
		}

		.section-title {
			color: rgba(255, 255, 255, 0.7);
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-bottom: 12px;
		}

		.app-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 16px;
		}

		.app-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 16px;
			border-radius: 8px;
			cursor: pointer;
			background: none;
			border: none;
			color: #fff;
			font-family: inherit;
			transition: background 0.2s;
		}

		.app-item:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		.app-item:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.app-item:disabled {
			cursor: default;
			opacity: 0.6;
		}

		.visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}

		.app-icon {
			width: 48px;
			height: 48px;
			background: linear-gradient(135deg, #333 0%, #1a1a1a 100%);
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 24px;
		}

		.app-icon.terminal {
			background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
		}

		.app-name {
			font-size: 12px;
			color: rgba(255, 255, 255, 0.9);
		}
	`;

	private _dispatchOpenTerminal(): void {
		this.dispatchEvent(
			new CustomEvent("open-terminal", { bubbles: true, composed: true }),
		);
	}

	private _dispatchOpenBrowser(): void {
		this.dispatchEvent(
			new CustomEvent("open-browser", { bubbles: true, composed: true }),
		);
	}

	override render() {
		return html`
			<label for="app-search" class="visually-hidden">Search applications</label>
			<input
				id="app-search"
				type="text"
				class="search-box"
				placeholder="Type to search…"
				readonly
				aria-label="Search applications"
			/>

			<div class="section-title">Applications</div>

			<div class="app-grid">
				<button
					class="app-item"
					@click=${this._dispatchOpenTerminal}
					aria-label="Open Terminal"
				>
					<div class="app-icon terminal">
						<iconify-icon
							icon="lucide:terminal"
							width="28"
							height="28"
							style="color: #4ec9b0"
							aria-hidden="true"
						></iconify-icon>
					</div>
					<span class="app-name">Terminal</span>
				</button>

				<button
					class="app-item"
					@click=${this._dispatchOpenBrowser}
					aria-label="Open Browser"
				>
					<div class="app-icon">
						<iconify-icon
							icon="lucide:globe"
							width="28"
							height="28"
							style="color: #3584e4"
							aria-hidden="true"
						></iconify-icon>
					</div>
					<span class="app-name">Browser</span>
				</button>

				<button class="app-item" disabled aria-label="Files (disabled)">
					<div class="app-icon">
						<iconify-icon
							icon="lucide:folder"
							width="28"
							height="28"
							style="color: #f9ca24"
							aria-hidden="true"
						></iconify-icon>
					</div>
					<span class="app-name">Files</span>
				</button>

				<button class="app-item" disabled aria-label="Settings (disabled)">
					<div class="app-icon">
						<iconify-icon
							icon="lucide:settings"
							width="28"
							height="28"
							style="color: #a0a0a0"
							aria-hidden="true"
						></iconify-icon>
					</div>
					<span class="app-name">Settings</span>
				</button>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-grid-widget": AppGridWidget;
	}
}
