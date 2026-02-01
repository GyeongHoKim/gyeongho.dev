/**
 * Menu Widget
 *
 * Gnome-style activities/applications menu with option to open terminal.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "iconify-icon";

@customElement("menu-widget")
export class MenuWidget extends LitElement {
	static styles = css`
		:host {
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100vh;
			z-index: 100;
		}

		.backdrop {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.5);
		}

		.menu-panel {
			position: absolute;
			top: 32px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(40, 40, 40, 0.95);
			border-radius: 0 0 12px 12px;
			padding: 24px;
			min-width: 400px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
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

	private handleBackdropClick(e: Event) {
		if ((e.target as HTMLElement).classList.contains("backdrop")) {
			this.dispatchEvent(new CustomEvent("close-menu"));
		}
	}

	private handleOpenTerminal() {
		this.dispatchEvent(new CustomEvent("open-terminal"));
	}

	render() {
		return html`
			<div class="backdrop" @click=${this.handleBackdropClick}>
				<div class="menu-panel">
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
						<button class="app-item" @click=${this.handleOpenTerminal} aria-label="Open Terminal">
							<div class="app-icon terminal">
								<iconify-icon icon="lucide:terminal" width="28" height="28" style="color: #4ec9b0" aria-hidden="true"></iconify-icon>
							</div>
							<span class="app-name">Terminal</span>
						</button>

						<button class="app-item" disabled aria-label="Files (disabled)">
							<div class="app-icon">
								<iconify-icon icon="lucide:folder" width="28" height="28" style="color: #f9ca24" aria-hidden="true"></iconify-icon>
							</div>
							<span class="app-name">Files</span>
						</button>

						<button class="app-item" disabled aria-label="Settings (disabled)">
							<div class="app-icon">
								<iconify-icon icon="lucide:settings" width="28" height="28" style="color: #a0a0a0" aria-hidden="true"></iconify-icon>
							</div>
							<span class="app-name">Settings</span>
						</button>
					</div>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"menu-widget": MenuWidget;
	}
}
