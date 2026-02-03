/**
 * Menu Widget
 *
 * Gnome-style activities overlay: backdrop + app grid. Dispatches close-menu;
 * open-terminal and open-browser bubble from app-grid-widget.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "../../app-grid/ui/app-grid-widget.ts";

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
	`;

	private _handleBackdropClick(e: Event): void {
		if ((e.target as HTMLElement).classList.contains("backdrop")) {
			this.dispatchEvent(new CustomEvent("close-menu", { bubbles: true }));
		}
	}

	override render() {
		return html`
			<div class="backdrop" @click=${this._handleBackdropClick}>
				<div class="menu-panel">
					<app-grid-widget></app-grid-widget>
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
