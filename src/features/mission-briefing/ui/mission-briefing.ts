/**
 * Mission Briefing
 *
 * Full-screen mission briefing with 3D employee card (Three.js + GLB + texture).
 * Dispatches "accept" when user clicks Accept mission; app sets briefing seen and routes to desktop.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { EmployeeCardSceneController } from "../lib/employee-card-scene-controller.ts";

@customElement("mission-briefing")
export class MissionBriefing extends LitElement {
	private readonly _scene = new EmployeeCardSceneController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			position: relative;
			background: #0a0a12;
		}

		.canvas-wrap {
			position: absolute;
			inset: 0;
		}

		.canvas-wrap canvas {
			display: block;
			width: 100%;
			height: 100%;
		}

		.overlay {
			position: absolute;
			inset: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: flex-end;
			padding: 2rem;
			padding-bottom: 4rem;
			background: linear-gradient(
				to top,
				rgba(10, 10, 18, 0.95) 0%,
				rgba(10, 10, 18, 0.4) 40%,
				transparent 100%
			);
			pointer-events: none;
		}

		.overlay > * {
			pointer-events: auto;
		}

		.mission-text {
			max-width: 520px;
			text-align: center;
			color: rgba(255, 255, 255, 0.9);
			font-family: "Cantarell", "Segoe UI", sans-serif;
			font-size: 1rem;
			line-height: 1.5;
			margin-bottom: 1.5rem;
		}

		.mission-text strong {
			color: #4ec9b0;
		}

		.accept-btn {
			padding: 0.75rem 2rem;
			font-size: 1rem;
			font-family: inherit;
			font-weight: 500;
			color: #0a0a12;
			background: #4ec9b0;
			border: none;
			border-radius: 8px;
			cursor: pointer;
			transition: background 0.2s ease, transform 0.1s ease;
		}

		.accept-btn:hover {
			background: #6ee0c8;
		}

		.accept-btn:active {
			transform: scale(0.98);
		}

		.accept-btn:focus-visible {
			outline: 2px solid #4ec9b0;
			outline-offset: 2px;
		}
	`;

	protected firstUpdated(): void {
		const canvas = this.shadowRoot?.querySelector("canvas");
		if (canvas) this._scene.init(canvas as HTMLCanvasElement);
	}

	private handleAccept(): void {
		this.dispatchEvent(new CustomEvent("accept", { bubbles: true }));
	}

	render() {
		return html`
			<div class="canvas-wrap">
				<canvas></canvas>
			</div>
			<div class="overlay">
				<p class="mission-text">
					${msg(
						html`<strong>TARGET: GyeongHo Kim.</strong><br />
						Extract the dossier from this system. You will be inserted as
						<strong>visitor</strong>. Find the decryption key, then switch to
						<strong>gyeonghokim</strong> and run the dossier.`,
						{ desc: "Mission briefing text" },
					)}
				</p>
				<button class="accept-btn" @click=${this.handleAccept}>
					${msg("Accept mission", { desc: "Mission briefing button" })}
				</button>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mission-briefing": MissionBriefing;
	}
}
