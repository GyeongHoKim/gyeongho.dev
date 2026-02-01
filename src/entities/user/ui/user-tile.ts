/**
 * User tile — GDM-style: large circular avatar, name below (vertical).
 * Horizontal row on login screen.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { msg, str, updateWhenLocaleChanges } from "@lit/localize";
import type { User } from "../model/types.js";

@customElement("user-tile")
export class UserTile extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: block;
		}
		button {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.75rem;
			padding: 1rem;
			background: transparent;
			border: none;
			border-radius: 12px;
			color: inherit;
			font-family: inherit;
			font-size: 0.875rem;
			text-align: center;
			cursor: pointer;
			transition: background 0.15s ease;
		}
		button:hover {
			background: rgba(255, 255, 255, 0.08);
		}
		button:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}
		/* GDM: large circular avatar (96px) */
		.avatar {
			width: 96px;
			height: 96px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.1);
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 2rem;
			font-weight: 300;
			color: rgba(255, 255, 255, 0.7);
		}
		.name {
			font-weight: 400;
			letter-spacing: 0.01em;
			max-width: 120px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		@media (prefers-reduced-motion: reduce) {
			button {
				transition: none;
			}
		}
	`;

	@property({ type: Object }) user!: User;

	render() {
		if (!this.user) return html`<span></span>`;
		const initial = this.user.displayName.charAt(0).toUpperCase();
		return html`
			<button
				type="button"
				data-user-id="${this.user.id}"
				aria-label="${msg(str`Select user ${this.user.displayName}`, { desc: "Login user tile" })}"
				@click=${this._onClick}
			>
				<div class="avatar" aria-hidden="true">${initial}</div>
				<span class="name">${this.user.displayName}</span>
			</button>
		`;
	}

	private _onClick(): void {
		this.dispatchEvent(
			new CustomEvent("user-select", {
				detail: this.user,
				bubbles: true,
				composed: true,
			}),
		);
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"user-tile": UserTile;
	}
}
