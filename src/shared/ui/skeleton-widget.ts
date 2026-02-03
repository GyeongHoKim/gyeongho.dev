/**
 * Skeleton Widget
 *
 * Reusable loading placeholder. Use while lazy-loaded content is being fetched.
 * Fills the main content area with a subtle shimmer for better perceived feedback.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("skeleton-widget")
export class SkeletonWidget extends LitElement {
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			min-height: 100vh;
		}

		.skeleton {
			width: 100%;
			height: 100%;
			min-height: 100vh;
			background: linear-gradient(
				90deg,
				rgba(255, 255, 255, 0.03) 0%,
				rgba(255, 255, 255, 0.06) 50%,
				rgba(255, 255, 255, 0.03) 100%
			);
			background-size: 200% 100%;
			animation: shimmer 1.2s ease-in-out infinite;
		}

		@keyframes shimmer {
			0% {
				background-position: 200% 0;
			}
			100% {
				background-position: -200% 0;
			}
		}
	`;

	override render() {
		return html`
			<div
				class="skeleton"
				role="status"
				aria-busy="true"
				aria-label="Loading"
			></div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"skeleton-widget": SkeletonWidget;
	}
}
