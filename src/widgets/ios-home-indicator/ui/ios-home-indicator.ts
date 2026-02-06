/**
 * iOS Home Indicator — the bottom bar/pill that appears on Face ID iPhones.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ios-home-indicator")
export class IosHomeIndicator extends LitElement {
	@property({ type: String }) variant: "light" | "dark" = "light";

	static styles = css`
		:host {
			display: block;
			width: 100%;
			pointer-events: none;
		}

		.indicator-wrap {
			display: flex;
			justify-content: center;
			padding: 8px 0 6px 0;
		}

		.pill {
			width: 134px;
			height: 5px;
			border-radius: 3px;
		}

		:host([variant="light"]) .pill,
		.pill {
			background: rgba(255, 255, 255, 0.5);
		}

		:host([variant="dark"]) .pill {
			background: rgba(0, 0, 0, 0.3);
		}
	`;

	render() {
		return html`
			<div class="indicator-wrap" aria-hidden="true">
				<div class="pill"></div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"ios-home-indicator": IosHomeIndicator;
	}
}
