/**
 * Browser App
 *
 * Simulated browser that loads the login page at 192.168.1.20:8080/login.
 * Users can attempt SQL injection to unlock the resume.
 * All UI is rendered with Lit templates; server returns JSON only.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "../../../widgets/floating-window/ui/floating-window.ts";
import {
	setMinimized,
	closeApp,
} from "../../../shared/lib/window-store.js";
import { getNetwork } from "../../network-simulation/lib/network.ts";
import { handleHttpRequest } from "../../network-simulation/lib/http-handler.ts";
import type { HttpRequest } from "../../network-simulation/model/types.ts";

const LOGIN_URL = "http://192.168.1.20:8080/login";

type LoginPageData =
	| { type: "login_form" }
	| { type: "user_list"; users: string[] }
	| { type: "error"; message: string }
	| { type: "user_profile"; user: string; hasResume: boolean };

@customElement("browser-app")
export class BrowserApp extends LitElement {
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

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	@state()
	private pageData: LoginPageData = { type: "login_form" };

	override firstUpdated() {
		this.loadLoginPage();
	}

	private loadLoginPage() {
		const network = getNetwork();
		const request: HttpRequest = {
			method: "GET",
			path: "/login",
			queryParams: {},
		};
		const response = handleHttpRequest(network, "192.168.1.20", 8080, request);
		this.pageData = this.parseLoginResponse(response);
	}

	private parseLoginResponse(response: { status: number; body: string }): LoginPageData {
		try {
			const data = JSON.parse(response.body) as LoginPageData;
			if (data.type === "login_form" || data.type === "user_list" || data.type === "error") {
				return data;
			}
		} catch {
			// ignore
		}
		return { type: "login_form" };
	}

	private handleLoginSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const username = (form.querySelector('[name="username"]') as HTMLInputElement)?.value ?? "";
		const password = (form.querySelector('[name="password"]') as HTMLInputElement)?.value ?? "";

		const body = new URLSearchParams({ username, password }).toString();
		const network = getNetwork();
		const request: HttpRequest = {
			method: "POST",
			path: "/login",
			queryParams: {},
			body,
		};
		const response = handleHttpRequest(network, "192.168.1.20", 8080, request);
		this.pageData = this.parseLoginResponse(response);
	}

	private handleUserClick(user: string) {
		if (user === "gyeonghokim") {
			this.dispatchEvent(
				new CustomEvent("resume-revealed", { bubbles: true, composed: true }),
			);
		} else {
			this.pageData = { type: "user_profile", user, hasResume: false };
		}
	}

	private handleBackToLogin() {
		this.pageData = { type: "login_form" };
	}

	private handleClose() {
		closeApp("browser");
	}

	private handleMinimize() {
		setMinimized("browser", true);
	}

	private renderPageContent() {
		switch (this.pageData.type) {
			case "login_form":
				return html`
					<h1>${msg("Sign in", { id: "browser-login-heading", desc: "Login form heading" })}</h1>
					<form class="login-form" @submit=${this.handleLoginSubmit}>
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
						${this.pageData.users.map(
							(user) => html`
								<li>
									<button type="button" @click=${() => this.handleUserClick(user)}>
										${user}
									</button>
								</li>
							`,
						)}
					</ul>
				`;
			case "error":
				return html`
					<h1 class="error-msg">${this.pageData.message}</h1>
					<button type="button" class="btn btn-link" @click=${this.handleBackToLogin}>
						${msg("Back to login", { desc: "Back link" })}
					</button>
				`;
			case "user_profile":
				return html`
					<h1>${this.pageData.user}</h1>
					<p>${msg("No resume for this user.", { desc: "No resume message" })}</p>
					<button type="button" class="btn btn-link" @click=${this.handleBackToLogin}>
						${msg("Back to login", { desc: "Back link" })}
					</button>
				`;
		}
	}

	override render() {
		return html`
			<floating-window
				title=${msg("Browser", { desc: "Window title" })}
				@window-minimize=${this.handleMinimize}
				@window-close=${this.handleClose}
			>
				<div slot="content" class="browser-content-wrap">
					<div class="address-bar">
						<input
							type="text"
							readonly
							value=${LOGIN_URL}
							aria-label="Address"
						/>
					</div>
					<div class="content-area">
						${this.renderPageContent()}
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
