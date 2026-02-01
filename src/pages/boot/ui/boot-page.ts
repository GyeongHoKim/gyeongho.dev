/**
 * Boot page — GDM/Fedora Workstation splash style.
 * Centered logo, minimal text, spinner. Adwaita dark (#242424).
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";

@customElement("boot-page")
export class BootPage extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			/* Adwaita dark (GDM/shell) */
			background: #242424;
			color: rgba(255, 255, 255, 0.9);
			font-family: Cantarell, "Segoe UI", system-ui, sans-serif;
			box-sizing: border-box;
		}
		.wrap {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100%;
			padding: 2rem;
		}
		/* Fedora/GNOME splash: centered logo area */
		.logo-wrap {
			width: 96px;
			height: 96px;
			margin-bottom: 1.5rem;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.08);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
		}
		.logo-wrap img {
			width: 64px;
			height: 64px;
			object-fit: contain;
		}
		/* GDM-style progress: dot pulse or spinner */
		.progress {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			margin-top: 0.5rem;
		}
		.dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: #3584e4;
			opacity: 0.4;
			animation: pulse 1.2s ease-in-out infinite;
		}
		.dot:nth-child(2) {
			animation-delay: 0.2s;
		}
		.dot:nth-child(3) {
			animation-delay: 0.4s;
		}
		@media (prefers-reduced-motion: reduce) {
			.dot {
				animation: none;
				opacity: 0.8;
			}
		}
		@keyframes pulse {
			0%,
			100% {
				opacity: 0.4;
				transform: scale(1);
			}
			50% {
				opacity: 1;
				transform: scale(1.1);
			}
		}
	`;

	render() {
		return html`
			<div class="wrap" role="status" aria-live="polite" aria-label="${msg("Loading", { desc: "Boot/splash screen loading state" })}">
				<div class="logo-wrap" aria-hidden="true">
					<img src="/gnome/laptop.webp" alt="" width="64" height="64" aria-hidden="true" />
				</div>
				<div class="progress" aria-hidden="true">
					<span class="dot"></span>
					<span class="dot"></span>
					<span class="dot"></span>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"boot-page": BootPage;
	}
}
