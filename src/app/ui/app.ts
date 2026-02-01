/**
 * App Entry — first visit: briefing → desktop; else boot → login → desktop.
 * Returning users always see boot then login (no skip to desktop).
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { getLocale } from "../../lib/localization.ts";
import {
	subscribeAuth,
} from "../../features/auth/model/auth-state.js";
import type { AuthState } from "../../features/auth/model/auth-state.js";
import "../../features/mission-briefing/ui/mission-briefing.ts";
import "../../pages/boot/ui/boot-page.ts";
import "../../pages/login/ui/login-page.ts";
import "../../pages/desktop/ui/desktop-page.ts";

const BRIEFING_SEEN_KEY = "gyeongho-dev-briefing-seen";

type Route = "boot" | "briefing" | "login" | "desktop";

@customElement("app-root")
export class AppRoot extends LitElement {
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

	@state() private route: Route = "boot";
	private _unsub?: () => void;
	private _bootTimeoutId?: ReturnType<typeof setTimeout>;

	connectedCallback(): void {
		super.connectedCallback();
		const briefingSeen = typeof localStorage !== "undefined" && localStorage.getItem(BRIEFING_SEEN_KEY);
		if (!briefingSeen) {
			this.route = "briefing";
			this._unsub = subscribeAuth((state: AuthState) => {
				if (state.user) this.route = "desktop";
				else if (this.route === "desktop") this.route = "login";
			});
			return;
		}
		// Returning users: always show boot then login (do not skip to desktop)
		this.route = "boot";
		setTimeout(() => {
			if (this.route === "boot") this.route = "login";
		}, 1500);
		this._unsub = subscribeAuth((state: AuthState) => {
			if (state.user) this.route = "desktop";
			else if (this.route === "desktop") this.route = "login";
		});
	}

	disconnectedCallback(): void {
		if (this._bootTimeoutId !== undefined) {
			clearTimeout(this._bootTimeoutId);
		}
		this._unsub?.();
		super.disconnectedCallback();
	}

	protected updated(_changedProperties: Map<string, unknown>): void {
		document.title = msg("gyeongho.dev", { desc: "Page title" });
		document.documentElement.lang = getLocale();
	}

	private _onBriefingAccept(): void {
		try {
			localStorage.setItem(BRIEFING_SEEN_KEY, "1");
		} catch {
			// ignore
		}
		// Do not setVisitor() here — let user see boot → login, then choose visitor on login page
		this.route = "boot";
		this._bootTimeoutId = setTimeout(() => {
			this._bootTimeoutId = undefined;
			if (this.route === "boot") this.route = "login";
		}, 1500);
	}

	render() {
		if (this.route === "briefing") {
			return html`
				<mission-briefing @accept=${this._onBriefingAccept}></mission-briefing>
			`;
		}
		if (this.route === "boot") return html`<boot-page></boot-page>`;
		if (this.route === "login") return html`<login-page></login-page>`;
		return html`<desktop-page></desktop-page>`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-root": AppRoot;
	}
}
