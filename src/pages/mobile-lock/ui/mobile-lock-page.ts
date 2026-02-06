/**
 * Mobile Lock Page — authentic iOS lock screen.
 * Shows lock icon, time, date, flashlight/camera at bottom corners.
 * Swipe up → dispatches "show-passcode" event.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../../../widgets/ios-status-bar/ui/ios-status-bar.ts";
import "../../../widgets/ios-home-indicator/ui/ios-home-indicator.ts";

@customElement("mobile-lock-page")
export class MobileLockPage extends LitElement {
	@state() private _swiping = false;
	@state() private _swipeY = 0;
	private _startY = 0;

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			height: 100dvh;
			position: relative;
			overflow: hidden;
			touch-action: none;
		}

		.lock-screen {
			width: 100%;
			height: 100%;
			background: linear-gradient(160deg, #0a0a1a 0%, #1a1a3e 40%, #0f2847 70%, #0a1628 100%);
			display: flex;
			flex-direction: column;
			transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1),
				opacity 0.35s ease;
		}

		.lock-screen.swiping {
			transition: none;
		}

		.lock-screen.dismissed {
			transform: translateY(-100%);
			opacity: 0;
		}

		.content {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding-top: 14vh;
		}

		/* Lock icon — padlock */
		.lock-icon {
			margin-bottom: 12px;
		}

		.lock-icon svg {
			display: block;
		}

		.time {
			font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
			font-size: 82px;
			font-weight: 700;
			letter-spacing: -1.5px;
			color: #fff;
			line-height: 1;
			margin-bottom: 2px;
		}

		.date {
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 17px;
			font-weight: 400;
			color: rgba(255, 255, 255, 0.85);
		}

		/* Bottom section */
		.bottom {
			padding: 0 16px 8px 16px;
		}

		.bottom-actions {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 0 30px;
			margin-bottom: 16px;
		}

		.action-circle {
			width: 50px;
			height: 50px;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.18);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
			display: flex;
			align-items: center;
			justify-content: center;
			border: none;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}

		.action-circle:active {
			background: rgba(255, 255, 255, 0.3);
		}

		.action-circle svg {
			display: block;
		}

		@media (prefers-reduced-motion: reduce) {
			.lock-screen {
				transition: none;
			}
		}
	`;

	private _getTime(): string {
		const now = new Date();
		const h = now.getHours();
		const m = now.getMinutes().toString().padStart(2, "0");
		return `${h}:${m}`;
	}

	private _getDate(): string {
		const now = new Date();
		return now.toLocaleDateString(undefined, {
			weekday: "long",
			month: "long",
			day: "numeric",
		});
	}

	private _onTouchStart(e: TouchEvent): void {
		this._startY = e.touches[0].clientY;
		this._swiping = true;
		this._swipeY = 0;
	}

	private _onTouchMove(e: TouchEvent): void {
		if (!this._swiping) return;
		const delta = this._startY - e.touches[0].clientY;
		this._swipeY = Math.max(0, delta);
	}

	private _onTouchEnd(): void {
		if (this._swipeY > 60) {
			this._goToPasscode();
		}
		this._swiping = false;
		this._swipeY = 0;
	}

	private _onClick(): void {
		this._goToPasscode();
	}

	private _goToPasscode(): void {
		const screen = this.shadowRoot?.querySelector(".lock-screen");
		screen?.classList.add("dismissed");
		setTimeout(() => {
			this.dispatchEvent(
				new CustomEvent("show-passcode", { bubbles: true, composed: true }),
			);
		}, 350);
	}

	render() {
		const swipeTransform =
			this._swiping && this._swipeY > 0 ? `translateY(-${this._swipeY}px)` : "";
		return html`
			<div
				class="lock-screen ${this._swiping ? "swiping" : ""}"
				style="${swipeTransform ? `transform: ${swipeTransform}` : ""}"
				@touchstart=${this._onTouchStart}
				@touchmove=${this._onTouchMove}
				@touchend=${this._onTouchEnd}
				@click=${this._onClick}
			>
				<ios-status-bar variant="light"></ios-status-bar>

				<div class="content">
					<div class="lock-icon">
						<svg width="24" height="28" viewBox="0 0 24 28" fill="none" aria-hidden="true">
							<path d="M5 12V8a7 7 0 1114 0v4" stroke="rgba(255,255,255,0.85)" stroke-width="2.5" stroke-linecap="round"/>
							<rect x="1" y="12" width="22" height="15" rx="5" fill="rgba(255,255,255,0.85)"/>
						</svg>
					</div>
					<div class="time">${this._getTime()}</div>
					<div class="date">${this._getDate()}</div>
				</div>

				<div class="bottom">
					<div class="bottom-actions">
						<button class="action-circle" aria-label="Flashlight">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<path d="M7 1h6v5l1 2v3a1 1 0 01-1 1h-2v7a1 1 0 01-2 0v-7H7a1 1 0 01-1-1V8l1-2V1z" fill="#fff"/>
							</svg>
						</button>
						<button class="action-circle" aria-label="Camera">
							<svg width="22" height="18" viewBox="0 0 22 18" fill="none" aria-hidden="true">
								<path d="M7.5 2L6 4.5H3a2 2 0 00-2 2V15a2 2 0 002 2h16a2 2 0 002-2V6.5a2 2 0 00-2-2h-3L14.5 2h-7z" stroke="#fff" stroke-width="1.5"/>
								<circle cx="11" cy="10.5" r="3.5" stroke="#fff" stroke-width="1.5"/>
							</svg>
						</button>
					</div>
					<ios-home-indicator variant="light"></ios-home-indicator>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mobile-lock-page": MobileLockPage;
	}
}
