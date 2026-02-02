/**
 * Desktop background — Three.js space scene (need_some_space.glb).
 * Renders behind desktop content; slowly rotates. Non-interactive (pointer-events: none).
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { createSpaceScene } from "../lib/space-scene.js";
import type { SpaceSceneApi } from "../lib/space-scene.js";

@customElement("desktop-background")
export class DesktopBackground extends LitElement {
	private sceneApi: SpaceSceneApi | null = null;

	static styles = css`
		:host {
			display: block;
			position: absolute;
			inset: 0;
			z-index: 0;
			pointer-events: none;
		}

		.canvas-wrap {
			position: absolute;
			inset: 0;
			background: #0a0a12;
		}

		.canvas-wrap canvas {
			display: block;
			width: 100%;
			height: 100%;
		}
	`;

	override disconnectedCallback(): void {
		this.sceneApi?.dispose();
		this.sceneApi = null;
		super.disconnectedCallback();
	}

	protected override firstUpdated(): void {
		const canvas = this.shadowRoot?.querySelector("canvas");
		if (!canvas) return;
		this.sceneApi = createSpaceScene(canvas);
	}

	override render() {
		return html`
			<div class="canvas-wrap">
				<canvas></canvas>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"desktop-background": DesktopBackground;
	}
}
