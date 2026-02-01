/**
 * Login page — GDM (GNOME Display Manager) style.
 * Full-screen Adwaita dark, horizontal user row (avatar + name below), bottom bar.
 * Password inline below user row when gyeonghokim selected (no modal).
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, str, updateWhenLocaleChanges } from "@lit/localize";
import {
	setVisitor,
	startGyeonghokimLogin,
	setGyeonghokimSuccess,
	setGyeonghokimError,
	clearError,
	getAuthState,
	subscribeAuth,
} from "../../../features/auth/model/auth-state.js";
import { validateGyeonghokimPassword } from "../../../features/auth/lib/validate-password.js";
import { USERS } from "../../../entities/user/model/types.js";
import type { User } from "../../../entities/user/model/types.js";
import "../../../entities/user/ui/user-tile.ts";

@customElement("login-page")
export class LoginPage extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			/* Adwaita dark (GDM) */
			background: #242424;
			color: rgba(255, 255, 255, 0.9);
			font-family: Cantarell, "Segoe UI", system-ui, sans-serif;
			box-sizing: border-box;
		}
		.main {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100%;
			padding: 2rem;
			padding-bottom: 80px;
		}
		/* GDM: horizontal user list, no title */
		.user-list {
			display: flex;
			flex-direction: row;
			align-items: center;
			justify-content: center;
			gap: 1.5rem;
			flex-wrap: wrap;
		}
		user-tile {
			display: block;
		}
		/* Inline password (GDM: below user row) */
		.password-bar {
			margin-top: 2rem;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1rem;
			max-width: 320px;
			width: 100%;
		}
		.password-bar input {
			width: 100%;
			padding: 0.75rem 1rem;
			font-size: 1rem;
			font-family: inherit;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 8px;
			color: inherit;
			box-sizing: border-box;
		}
		.password-bar input:focus {
			outline: 2px solid #3584e4;
			outline-offset: 0;
		}
		.password-actions {
			display: flex;
			gap: 0.75rem;
			justify-content: center;
		}
		.password-actions button {
			padding: 0.5rem 1.25rem;
			font-size: 0.875rem;
			font-family: inherit;
			border-radius: 8px;
			border: none;
			cursor: pointer;
			background: rgba(255, 255, 255, 0.1);
			color: inherit;
		}
		.password-actions button:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		.password-actions button:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}
		.password-actions button.unlock {
			background: #3584e4;
			color: #fff;
		}
		.password-actions button.unlock:hover {
			background: #62a0ea;
		}
		.error-msg {
			font-size: 0.875rem;
			color: #f66151;
			margin: 0;
			text-align: center;
		}
		/* GDM bottom bar */
		.bottom-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 1rem;
			background: rgba(0, 0, 0, 0.3);
			font-size: 0.875rem;
		}
		.bottom-bar-left,
		.bottom-bar-right {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}
		.bottom-bar button {
			background: none;
			border: none;
			color: rgba(255, 255, 255, 0.8);
			cursor: pointer;
			padding: 0.5rem;
			border-radius: 6px;
			font-family: inherit;
			font-size: inherit;
		}
		.bottom-bar button:hover {
			background: rgba(255, 255, 255, 0.08);
			color: #fff;
		}
		.bottom-bar button:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}
		@media (prefers-reduced-motion: reduce) {
			* {
				transition: none !important;
			}
		}
	`;

	@state() private _passwordUser: User | null = null;
	@state() private _password = "";
	@state() private _authState = getAuthState();
	private _unsub?: () => void;

	connectedCallback(): void {
		super.connectedCallback();
		this._unsub = subscribeAuth((s) => {
			this._authState = s;
		});
	}

	disconnectedCallback(): void {
		this._unsub?.();
		super.disconnectedCallback();
	}

	render() {
		const authState = this._authState;
		const showPassword = this._passwordUser !== null;
		return html`
			<div class="main" role="main" aria-label="${msg("Select user to sign in", { desc: "Login page main area" })}">
				${
					authState.status === "error" && !showPassword
						? html`<p class="error-msg" role="alert">${authState.errorMessage ?? msg("Sign-in failed.", { desc: "Login error" })}</p>`
						: ""
				}
				<div class="user-list" role="list">
					${USERS.map(
						(user) =>
							html`<user-tile
								.user=${user}
								@user-select=${this._onUserSelect}
								role="listitem"
							></user-tile>`,
					)}
				</div>
				${
					showPassword
						? html`
							<div class="password-bar" role="form" aria-label="${msg(str`Password for ${this._passwordUser?.displayName ?? ""}`, { desc: "Password form for user" })}">
								${
									authState.errorMessage
										? html`<p class="error-msg" role="alert">${authState.errorMessage}</p>`
										: ""
								}
								<input
									type="password"
									placeholder="${msg("Password", { desc: "Password field" })}"
									autocomplete="current-password"
									.value=${this._password}
									@input=${this._onPasswordInput}
									@keydown=${this._onPasswordKeydown}
									aria-label="${msg("Password", { desc: "Password field" })}"
								/>
								<div class="password-actions">
									<button type="button" @click=${this._onPasswordCancel}>${msg("Cancel", { desc: "Cancel button" })}</button>
									<button type="button" class="unlock" @click=${this._onPasswordSubmit}>
										${msg("Unlock", { desc: "Unlock/login button" })}
									</button>
								</div>
							</div>
						`
						: ""
				}
			</div>
			<footer class="bottom-bar" role="contentinfo">
				<div class="bottom-bar-left">
					<button type="button" aria-label="${msg("Accessibility options", { desc: "Bottom bar" })}">${msg("Accessibility", { desc: "Accessibility button" })}</button>
				</div>
				<div class="bottom-bar-right">
					<button type="button" aria-label="${msg("Keyboard layout", { desc: "Bottom bar" })}">${msg("Keyboard", { desc: "Keyboard button" })}</button>
					<button type="button" aria-label="${msg("Power options", { desc: "Bottom bar" })}">${msg("Power", { desc: "Power button" })}</button>
				</div>
			</footer>
		`;
	}

	private _onUserSelect(e: CustomEvent<User>): void {
		const user = e.detail;
		if (user.role === "visitor") {
			setVisitor();
			return;
		}
		if (user.role === "authenticated") {
			clearError();
			this._passwordUser = user;
			this._password = "";
			startGyeonghokimLogin();
		}
	}

	private _onPasswordInput(e: Event): void {
		this._password = (e.target as HTMLInputElement).value;
		clearError();
	}

	private _onPasswordKeydown(e: KeyboardEvent): void {
		if (e.key === "Enter") this._onPasswordSubmit();
		if (e.key === "Escape") this._onPasswordCancel();
	}

	private _onPasswordSubmit(): void {
		if (validateGyeonghokimPassword(this._password)) {
			setGyeonghokimSuccess();
			this._passwordUser = null;
			this._password = "";
		} else {
			setGyeonghokimError(
				msg("Wrong password. Please try again.", { desc: "Login error" }),
			);
		}
	}

	private _onPasswordCancel(): void {
		this._passwordUser = null;
		this._password = "";
		clearError();
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"login-page": LoginPage;
	}
}
