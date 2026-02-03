/**
 * App Entry — first visit: briefing → desktop; else boot → login → desktop.
 * Returning users always see boot then login (no skip to desktop).
 * Routing and flow are handled by AppRouterController.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { getLocale } from "../../lib/localization.ts";
import { AppRouterController } from "../lib/app-router-controller.js";
import "../../features/mission-briefing/ui/mission-briefing.ts";
import "../../pages/boot/ui/boot-page.ts";
import "../../pages/login/ui/login-page.ts";
import "../../pages/desktop/ui/desktop-page.ts";

@customElement("app-root")
export class AppRoot extends LitElement {
	private readonly _router = new AppRouterController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
		}
	`;

	protected updated(_changedProperties: Map<string, unknown>): void {
		document.title = msg("gyeongho.dev", { desc: "Page title" });
		document.documentElement.lang = getLocale();
	}

	private _onBriefingAccept(): void {
		this._router.acceptBriefing();
	}

	render() {
		const route = this._router.route;
		if (route === "briefing") {
			return html`
				<div id="main" role="main" tabindex="-1">
					<mission-briefing @accept=${this._onBriefingAccept}></mission-briefing>
				</div>
			`;
		}
		if (route === "boot")
			return html`<div id="main" role="main" tabindex="-1"><boot-page></boot-page></div>`;
		if (route === "login")
			return html`<div id="main" role="main" tabindex="-1"><login-page></login-page></div>`;
		return html`<div id="main" role="main" tabindex="-1"><desktop-page></desktop-page></div>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
	}
}
