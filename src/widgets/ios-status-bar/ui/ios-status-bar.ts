/**
 * iOS Status Bar — simulates the iPhone status bar with Dynamic Island layout.
 * Time on left, Dynamic Island space in center, signal/wifi/battery on right.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ios-status-bar")
export class IosStatusBar extends LitElement {
	@property({ type: String, reflect: true }) variant: "light" | "dark" =
		"light";

	static styles = css`
		:host {
			display: block;
			width: 100%;
			user-select: none;
			-webkit-user-select: none;
			flex-shrink: 0;
		}

		.status-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 54px;
			padding: 12px 20px 0 20px;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 15px;
			font-weight: 600;
			letter-spacing: 0.01em;
		}

		:host([variant="light"]) .status-bar {
			color: #fff;
		}

		:host([variant="dark"]) .status-bar {
			color: #000;
		}

		.left {
			width: 54px;
			text-align: left;
		}

		.center {
			flex: 1;
			display: flex;
			justify-content: center;
		}

		.dynamic-island {
			width: 126px;
			height: 36px;
			background: #000;
			border-radius: 22px;
		}

		.right {
			width: 78px;
			display: flex;
			align-items: center;
			justify-content: flex-end;
			gap: 5px;
		}

		svg {
			display: block;
		}
	`;

	private _getTime(): string {
		const now = new Date();
		return now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	}

	render() {
		const c = this.variant === "dark" ? "#000" : "#fff";
		return html`
			<div class="status-bar">
				<div class="left">${this._getTime()}</div>
				<div class="center">
					<div class="dynamic-island"></div>
				</div>
				<div class="right">
					${this._renderSignal(c)}
					${this._renderWifi(c)}
					${this._renderBattery(c)}
				</div>
			</div>
		`;
	}

	private _renderSignal(color: string) {
		return html`<svg width="17" height="12" viewBox="0 0 17 12" fill="none" aria-hidden="true">
			<rect x="0" y="9" width="3" height="3" rx="0.5" fill="${color}"/>
			<rect x="4.5" y="6" width="3" height="6" rx="0.5" fill="${color}"/>
			<rect x="9" y="3" width="3" height="9" rx="0.5" fill="${color}"/>
			<rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="${color}"/>
		</svg>`;
	}

	private _renderWifi(color: string) {
		return html`<svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
			<path d="M8 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" fill="${color}"/>
			<path d="M4.7 8.3a4.7 4.7 0 016.6 0" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
			<path d="M2 5.5a8.5 8.5 0 0112 0" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
			<path d="M0 2.7C3.6 0 12.4 0 16 2.7" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
		</svg>`;
	}

	private _renderBattery(color: string) {
		return html`<svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden="true">
			<rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="${color}" stroke-opacity="0.35"/>
			<rect x="2" y="2" width="20" height="9" rx="2" fill="${color}"/>
			<path d="M25 4.5v4a2 2 0 000-4z" fill="${color}" fill-opacity="0.4"/>
		</svg>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"ios-status-bar": IosStatusBar;
	}
}
