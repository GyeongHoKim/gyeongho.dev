/**
 * App Entry — routes boot → login → desktop.
 * If user already in session (e.g. localStorage), skip to desktop.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import {
	getCurrentUser,
	subscribeAuth,
} from "../../features/auth/model/auth-state.js";
import type { AuthState } from "../../features/auth/model/auth-state.js";
import "../../pages/boot/ui/boot-page.ts";
import "../../pages/login/ui/login-page.ts";
import "../../pages/desktop/ui/desktop-page.ts";

type Route = "boot" | "login" | "desktop";

@customElement("app-root")
export class AppRoot extends LitElement {
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
		}
	`;

	@state() private route: Route = "boot";
	private _unsub?: () => void;

	connectedCallback(): void {
		super.connectedCallback();
		const user = getCurrentUser();
		if (user) {
			this.route = "desktop";
			return;
		}
		// Boot then login
		this.route = "boot";
		setTimeout(() => {
			if (this.route === "boot") this.route = "login";
		}, 1500);
		this._unsub = subscribeAuth((state: AuthState) => {
			if (state.user) this.route = "desktop";
		});
	}

	disconnectedCallback(): void {
		this._unsub?.();
		super.disconnectedCallback();
	}

	render() {
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
