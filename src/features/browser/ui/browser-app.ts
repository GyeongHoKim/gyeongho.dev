/**
 * Browser App
 *
 * Simulated browser that loads the login page at 192.168.1.20:8080/login.
 * URL, request/response, and page state are in BrowserSimulationController.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "../../../widgets/floating-window/ui/floating-window.ts";
import {
	setMinimized,
	closeApp,
	setWindowPosition,
} from "../../../shared/lib/window-store.js";
import {
	BrowserSimulationController,
	type LoginPageData,
} from "../lib/browser-simulation-controller.ts";

@customElement("browser-app")
export class BrowserApp extends LitElement {
	private readonly _browser = new BrowserSimulationController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
		}

		.browser-content-wrap {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0;
			background: #1e1e1e;
		}

		.address-bar {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			background: #2d2d2d;
			border-bottom: 1px solid #404040;
		}

		.address-bar input {
			flex: 1;
			padding: 6px 12px;
			background: #404040;
			border: none;
			border-radius: 4px;
			color: #d4d4d4;
			font-size: 13px;
			font-family: inherit;
		}

		.address-bar input:focus {
			outline: 2px solid #3584e4;
			outline-offset: 0;
		}

		.content-area {
			flex: 1;
			overflow: auto;
			padding: 2rem;
			font-family: sans-serif;
			color: #d4d4d4;
		}

		.content-area h1 {
			font-size: 1.25rem;
			font-weight: 400;
			margin: 0 0 1rem 0;
		}

		.login-form {
			max-width: 320px;
			margin: 0;
		}

		.login-form label {
			display: block;
			margin-top: 0.5rem;
		}

		.login-form input {
			width: 100%;
			padding: 8px 12px;
			margin: 4px 0 12px 0;
			box-sizing: border-box;
			background: #2d2d2d;
			border: 1px solid #404040;
			color: #d4d4d4;
			border-radius: 4px;
			font-size: 14px;
		}

		.btn {
			padding: 10px 20px;
			background: #3584e4;
			border: none;
			color: #fff;
			border-radius: 4px;
			cursor: pointer;
			font-size: 14px;
			font-family: inherit;
			margin-top: 8px;
		}

		.btn:hover {
			background: #1a73e8;
		}

		.btn-link {
			background: transparent;
			color: #3584e4;
			text-decoration: none;
			padding: 0;
			margin-top: 0;
		}

		.btn-link:hover {
			text-decoration: underline;
		}

		.user-list {
			list-style: none;
			padding: 0;
			margin: 1rem 0;
		}

		.user-list li {
			margin: 0.5rem 0;
		}

		.user-list button {
			background: none;
			border: none;
			color: #3584e4;
			cursor: pointer;
			font-size: inherit;
			padding: 0;
			text-align: left;
		}

		.user-list button:hover {
			text-decoration: underline;
		}

		.error-msg {
			color: #f44747;
		}
	`;

	override firstUpdated(): void {
		this._browser.loadLoginPage();
	}

	private _onLoginSubmit(e: Event): void {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const username =
			(form.querySelector('[name="username"]') as HTMLInputElement)?.value ??
			"";
		const password =
			(form.querySelector('[name="password"]') as HTMLInputElement)?.value ??
			"";
		this._browser.submitLogin(username, password);
	}

	private _renderPageContent(): ReturnType<typeof html> {
		const pageData: LoginPageData = this._browser.pageData;
		switch (pageData.type) {
			case "login_form":
				return html`
					<h1>${msg("Sign in", { id: "browser-login-heading", desc: "Login form heading" })}</h1>
					<form class="login-form" @submit=${this._onLoginSubmit}>
						<label for="browser-username">${msg("Username", { id: "browser-username-label", desc: "Login field" })}</label>
						<input
							id="browser-username"
							type="text"
							name="username"
							required
							autocomplete="username"
						/>
						<label for="browser-password">${msg("Password", { id: "browser-password-label", desc: "Login field" })}</label>
						<input
							id="browser-password"
							type="password"
							name="password"
							required
							autocomplete="current-password"
						/>
						<button type="submit" class="btn">${msg("Sign in", { id: "browser-login-button", desc: "Login button" })}</button>
					</form>
				`;
			case "user_list":
				return html`
					<h1>${msg("Logged in as admin", { desc: "Post-login heading" })}</h1>
					<p>${msg("Select a user to view profile.", { desc: "User list hint" })}</p>
					<ul class="user-list">
						${pageData.users.map(
							(user) => html`
								<li>
									<button type="button" @click=${() => this._browser.onUserClick(user)}>
										${user}
									</button>
								</li>
							`,
						)}
					</ul>
				`;
			case "error":
				return html`
					<h1 class="error-msg">${pageData.message}</h1>
					<button type="button" class="btn btn-link" @click=${() => this._browser.backToLogin()}>
						${msg("Back to login", { desc: "Back link" })}
					</button>
				`;
			case "user_profile":
				return html`
					<h1>${pageData.user}</h1>
					<p>${msg("No resume for this user.", { desc: "No resume message" })}</p>
					<button type="button" class="btn btn-link" @click=${() => this._browser.backToLogin()}>
						${msg("Back to login", { desc: "Back link" })}
					</button>
				`;
		}
	}

	override render() {
		return html`
			<floating-window
				title=${msg("Browser", { desc: "Window title" })}
				@window-minimize=${() => setMinimized("browser", true)}
				@window-close=${() => closeApp("browser")}
				@window-drag=${(
					e: CustomEvent<{ x: number; y: number }>,
				) => setWindowPosition("browser", e.detail)}
			>
				<div slot="content" class="browser-content-wrap">
					<div class="address-bar">
						<input
							type="text"
							readonly
							value=${this._browser.loginUrl}
							aria-label="Address"
						/>
					</div>
					<div class="content-area">
						${this._renderPageContent()}
					</div>
				</div>
			</floating-window>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"browser-app": BrowserApp;
	}
}
