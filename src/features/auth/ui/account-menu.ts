/**
 * Account Menu (auth feature)
 *
 * GNOME-style user menu for the top bar: shows current user, click opens
 * dropdown with "Sign out". Uses auth state and logout.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "iconify-icon";
import { getCurrentUser, logout, subscribeAuth } from "../model/auth-state.js";
import type { AuthState } from "../model/auth-state.js";

@customElement("account-menu")
export class AccountMenu extends LitElement {
	static styles = css`
		:host {
			display: inline-flex;
			position: relative;
		}

		.trigger {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			background: none;
			border: none;
			border-radius: 6px;
			color: #fff;
			font-size: 14px;
			font-family: inherit;
			cursor: pointer;
			transition: background 0.15s ease;
		}

		.trigger:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		.trigger:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.trigger iconify-icon {
			flex-shrink: 0;
		}

		.dropdown {
			position: absolute;
			top: 100%;
			right: 0;
			margin-top: 4px;
			min-width: 180px;
			background: rgba(40, 40, 40, 0.98);
			border-radius: 8px;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
			z-index: 200;
			overflow: hidden;
		}

		.menu-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 10px 14px;
			background: none;
			border: none;
			color: rgba(255, 255, 255, 0.9);
			font-size: 14px;
			font-family: inherit;
			text-align: left;
			cursor: pointer;
			transition: background 0.15s ease;
		}

		.menu-item:hover {
			background: rgba(255, 255, 255, 0.08);
		}

		.menu-item:focus-visible {
			outline: none;
			background: rgba(255, 255, 255, 0.12);
		}

		.menu-item iconify-icon {
			flex-shrink: 0;
			opacity: 0.9;
		}
	`;

	@state() private authState: AuthState = { user: null, status: "idle" };
	@state() private open = false;

	private _unsub?: () => void;
	private _boundCloseOnClickOutside = this._handleClickOutside.bind(this);

	connectedCallback(): void {
		super.connectedCallback();
		this.authState = { ...this.authState, user: getCurrentUser() };
		this._unsub = subscribeAuth((s) => {
			this.authState = s;
		});
	}

	disconnectedCallback(): void {
		this._unsub?.();
		document.removeEventListener("click", this._boundCloseOnClickOutside);
		super.disconnectedCallback();
	}

	private _handleClickOutside(e: Event): void {
		const target = e.target as Node;
		if (this.open && !this.contains(target)) {
			this.open = false;
			document.removeEventListener("click", this._boundCloseOnClickOutside);
		}
	}

	private _toggle(): void {
		this.open = !this.open;
		if (this.open) {
			setTimeout(() =>
				document.addEventListener("click", this._boundCloseOnClickOutside),
			);
		} else {
			document.removeEventListener("click", this._boundCloseOnClickOutside);
		}
	}

	private _signOut(): void {
		this.open = false;
		document.removeEventListener("click", this._boundCloseOnClickOutside);
		logout();
	}

	render() {
		const displayName = this.authState.user?.displayName ?? "Guest";

		return html`
			<button
				class="trigger"
				type="button"
				aria-haspopup="true"
				aria-expanded="${this.open}"
				aria-label="Account menu"
				@click=${this._toggle}
			>
				<iconify-icon icon="lucide:user-circle" width="20" height="20" aria-hidden="true"></iconify-icon>
				<span>${displayName}</span>
				<iconify-icon
					icon="lucide:chevron-down"
					width="16"
					height="16"
					aria-hidden="true"
					style="transform: ${this.open ? "rotate(180deg)" : "none"}; transition: transform 0.2s ease"
				></iconify-icon>
			</button>
			${this.open
				? html`
						<div class="dropdown" role="menu">
							<button
								class="menu-item"
								role="menuitem"
								type="button"
								@click=${this._signOut}
							>
								<iconify-icon icon="lucide:log-out" width="18" height="18" aria-hidden="true"></iconify-icon>
								Sign out
							</button>
						</div>
					`
				: null}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"account-menu": AccountMenu;
	}
}
