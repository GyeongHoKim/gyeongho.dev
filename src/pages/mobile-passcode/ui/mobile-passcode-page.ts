/**
 * Mobile Passcode Page — iOS passcode entry screen.
 * 4-digit passcode numpad with dots indicator. Code: 1116 (matches sudo/ssh password).
 * Dispatches "unlock" on correct code, "cancel-passcode" to go back.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "../../../widgets/ios-status-bar/ui/ios-status-bar.ts";

const PASSCODE = "1116";

@customElement("mobile-passcode-page")
export class MobilePasscodePage extends LitElement {
	@state() private _digits: string[] = [];
	@state() private _error = false;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			height: 100dvh;
			background: linear-gradient(160deg, #0a0a1a 0%, #1a1a3e 40%, #0f2847 70%, #0a1628 100%);
			overflow: hidden;
		}

		.passcode-screen {
			display: flex;
			flex-direction: column;
			align-items: center;
			height: 100%;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			padding-bottom: calc(24px + env(safe-area-inset-bottom));
			box-sizing: border-box;
		}

		.title {
			margin-top: 16vh;
			font-size: 20px;
			font-weight: 400;
			color: #fff;
			margin-bottom: 20px;
		}

		/* Passcode dots */
		.dots {
			display: flex;
			gap: 16px;
			margin-bottom: 48px;
		}

		.dot {
			width: 14px;
			height: 14px;
			border-radius: 50%;
			border: 2px solid rgba(255, 255, 255, 0.85);
			background: transparent;
			transition: background 0.15s ease;
		}

		.dot.filled {
			background: #fff;
			border-color: #fff;
		}

		.dot.error {
			border-color: #ff3b30;
			background: #ff3b30;
			animation: shake 0.5s ease;
		}

		@keyframes shake {
			0%, 100% { transform: translateX(0); }
			20% { transform: translateX(-8px); }
			40% { transform: translateX(8px); }
			60% { transform: translateX(-6px); }
			80% { transform: translateX(6px); }
		}

		/* Number pad */
		.numpad {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 16px;
			width: 280px;
		}

		.num-btn {
			width: 78px;
			height: 78px;
			border-radius: 50%;
			border: 1px solid rgba(255, 255, 255, 0.35);
			background: rgba(255, 255, 255, 0.08);
			color: #fff;
			font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
			font-size: 32px;
			font-weight: 300;
			cursor: pointer;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			-webkit-tap-highlight-color: transparent;
			transition: background 0.1s ease;
			justify-self: center;
		}

		.num-btn:active {
			background: rgba(255, 255, 255, 0.3);
		}

		.num-btn .sub {
			font-size: 9px;
			font-weight: 400;
			letter-spacing: 2px;
			color: rgba(255, 255, 255, 0.7);
			margin-top: 1px;
		}

		/* Bottom row special buttons */
		.text-btn {
			background: none;
			border: none;
			color: #fff;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 16px;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			display: flex;
			align-items: center;
			justify-content: center;
			justify-self: center;
			width: 78px;
			height: 78px;
		}

		.text-btn:active {
			opacity: 0.5;
		}

		.cancel-btn {
			background: none;
			border: none;
			color: #fff;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 16px;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
			padding: 8px 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			justify-self: center;
			width: 78px;
			height: 78px;
		}

		.cancel-btn:active {
			opacity: 0.5;
		}

		@media (prefers-reduced-motion: reduce) {
			.dot.error {
				animation: none;
			}
		}
	`;

	private _pad = [
		{ num: "1", sub: "" },
		{ num: "2", sub: "ABC" },
		{ num: "3", sub: "DEF" },
		{ num: "4", sub: "GHI" },
		{ num: "5", sub: "JKL" },
		{ num: "6", sub: "MNO" },
		{ num: "7", sub: "PQRS" },
		{ num: "8", sub: "TUV" },
		{ num: "9", sub: "WXYZ" },
	];

	private _onDigit(num: string): void {
		if (this._error) return;
		if (this._digits.length >= 4) return;

		const next = [...this._digits, num];
		this._digits = next;

		if (next.length === 4) {
			const code = next.join("");
			if (code === PASSCODE) {
				setTimeout(() => {
					this.dispatchEvent(
						new CustomEvent("unlock", { bubbles: true, composed: true }),
					);
				}, 200);
			} else {
				this._error = true;
				setTimeout(() => {
					this._digits = [];
					this._error = false;
				}, 800);
			}
		}
	}

	private _onDelete(): void {
		if (this._error) return;
		if (this._digits.length > 0) {
			this._digits = this._digits.slice(0, -1);
		}
	}

	private _onCancel(): void {
		this.dispatchEvent(
			new CustomEvent("cancel-passcode", { bubbles: true, composed: true }),
		);
	}

	render() {
		return html`
			<div class="passcode-screen">
				<ios-status-bar variant="light"></ios-status-bar>

				<div class="title">${msg("Enter Passcode", { desc: "Passcode screen title" })}</div>

				<div class="dots">
					${[0, 1, 2, 3].map(
						(i) => html`
							<div class="dot ${this._digits.length > i ? "filled" : ""} ${this._error ? "error" : ""}"></div>
						`,
					)}
				</div>

				<div class="numpad">
					${this._pad.map(
						(p) => html`
							<button class="num-btn" @click=${() => this._onDigit(p.num)}>
								${p.num}
								${p.sub ? html`<span class="sub">${p.sub}</span>` : null}
							</button>
						`,
					)}

					<button class="cancel-btn" @click=${this._onCancel}>
						${msg("Cancel", { desc: "Passcode cancel button" })}
					</button>
					<button class="num-btn" @click=${() => this._onDigit("0")}>0</button>
					<button class="text-btn" @click=${this._onDelete}>
						${msg("Delete", { desc: "Passcode delete button" })}
					</button>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mobile-passcode-page": MobilePasscodePage;
	}
}
