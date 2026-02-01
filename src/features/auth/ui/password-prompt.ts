/**
 * Password prompt UI when gyeonghokim is selected.
 * Fedora Workstation GNOME-style; keyboard accessible, clear error (Principle V).
 */

import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { User } from "../../../entities/user/model/types.js";

@customElement("password-prompt")
export class PasswordPrompt extends LitElement {
	static styles = css`
		:host {
			display: block;
		}
		.overlay {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.6);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
			padding: 1rem;
		}
		.dialog {
			background: #3d3846;
			border-radius: 12px;
			padding: 1.5rem;
			min-width: 280px;
			max-width: 360px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		}
		h2 {
			font-size: 1.125rem;
			font-weight: 500;
			margin: 0 0 1rem;
			color: rgba(255, 255, 255, 0.9);
		}
		label {
			display: block;
			font-size: 0.875rem;
			margin-bottom: 0.5rem;
			color: rgba(255, 255, 255, 0.8);
		}
		input {
			width: 100%;
			padding: 0.5rem 0.75rem;
			font-size: 1rem;
			font-family: inherit;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 8px;
			color: inherit;
			box-sizing: border-box;
		}
		input:focus {
			outline: 2px solid #3584e4;
			outline-offset: 0;
		}
		.error {
			font-size: 0.875rem;
			color: #f66151;
			margin-top: 0.5rem;
		}
		.actions {
			display: flex;
			gap: 0.75rem;
			justify-content: flex-end;
			margin-top: 1.25rem;
		}
		button {
			padding: 0.5rem 1rem;
			font-size: 0.875rem;
			font-family: inherit;
			border-radius: 8px;
			border: none;
			cursor: pointer;
			background: rgba(255, 255, 255, 0.1);
			color: inherit;
		}
		button:hover {
			background: rgba(255, 255, 255, 0.15);
		}
		button:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}
		button.primary {
			background: #3584e4;
			color: #fff;
		}
		button.primary:hover {
			background: #62a0ea;
		}
		.sr-only {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
		}
	`;

	@property({ type: Object }) user: User | null = null;
	@property({ type: String }) errorMessage = "";
	@state() private _password = "";

	render() {
		if (!this.user) return html`<span></span>`;
		return html`
			<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="pw-title" aria-describedby=${this.errorMessage ? "pw-err" : undefined}>
				<div class="dialog">
					<h2 id="pw-title">Enter password for ${this.user.displayName}</h2>
					<label for="pw-input">Password</label>
					<input
						id="pw-input"
						type="password"
						autocomplete="current-password"
						.value=${this._password}
						@input=${this._onInput}
						@keydown=${this._onKeydown}
						aria-invalid=${this.errorMessage ? "true" : "false"}
						aria-describedby=${this.errorMessage ? "pw-err" : undefined}
					/>
					${this.errorMessage ? html`<p id="pw-err" class="error" role="alert">${this.errorMessage}</p>` : ""}
					<div class="actions">
						<button type="button" @click=${this._cancel}>Cancel</button>
						<button type="button" class="primary" @click=${this._submit}>Sign in</button>
					</div>
				</div>
			</div>
		`;
	}

	private _onInput(e: Event): void {
		this._password = (e.target as HTMLInputElement).value;
		this.errorMessage = "";
	}

	private _onKeydown(e: KeyboardEvent): void {
		if (e.key === "Enter") this._submit();
		if (e.key === "Escape") this._cancel();
	}

	private _submit(): void {
		this.dispatchEvent(
			new CustomEvent("password-submit", {
				detail: this._password,
				bubbles: true,
				composed: true,
			}),
		);
	}

	private _cancel(): void {
		this.dispatchEvent(
			new CustomEvent("password-cancel", { bubbles: true, composed: true }),
		);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"password-prompt": PasswordPrompt;
	}
}
