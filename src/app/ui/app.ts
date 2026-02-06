/**
 * App Entry — device-aware root.
 * Router outlet + document metadata.
 */

import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { getLocale } from "../../lib/localization.ts";
import { createAppRouter } from "../lib/router/app-router.js";

@customElement("app-root")
export class AppRoot extends LitElement {
	private _destroyRouter?: () => void;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	protected createRenderRoot(): HTMLElement {
		return this;
	}

	protected firstUpdated(): void {
		this._destroyRouter = createAppRouter(this);
	}

	disconnectedCallback(): void {
		super.disconnectedCallback();
		this._destroyRouter?.();
	}

	protected updated(_changedProperties: Map<string, unknown>): void {
		document.title = msg("gyeongho.dev", { desc: "Page title" });
		document.documentElement.lang = getLocale();
	}

	render() {
		return html`
			<div id="router-outlet"></div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
	}
}
