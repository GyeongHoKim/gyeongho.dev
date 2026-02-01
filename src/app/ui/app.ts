/**
 * App Entry Component
 *
 * Main application entry that routes to the desktop page.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import "../../pages/desktop/ui/desktop-page.ts";

@customElement("app-root")
export class AppRoot extends LitElement {
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
		}
	`;

	render() {
		return html`<desktop-page></desktop-page>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
	}
}
