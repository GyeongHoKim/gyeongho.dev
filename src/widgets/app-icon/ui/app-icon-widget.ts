/**
 * App icon widget — shared icon (and optional label) for an app.
 * Used by dock-widget and desktop-icons-widget. Renders iconify or app SVG from app-registry.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "iconify-icon";
import type { AppId } from "../../../shared/lib/window-store.js";
import { getAppConfig } from "../../../shared/lib/app-registry.js";

@customElement("app-icon-widget")
export class AppIconWidget extends LitElement {
	/** App id; icon and label are resolved from app-registry. */
	@property() appId: AppId = "terminal";

	/** Icon size in pixels. */
	@property({ type: Number }) size = 48;

	/** Whether to show the app label below the icon. */
	@property({ type: Boolean }) showLabel = false;

	static styles = css`
		:host {
			display: inline-flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
		}

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.icon img,
		.icon ::slotted(img) {
			display: block;
			object-fit: contain;
		}

		.label {
			font-size: 12px;
			line-height: 1.2;
			word-break: break-word;
			text-align: center;
			color: rgba(255, 255, 255, 0.9);
		}
	`;

	override render() {
		const config = getAppConfig(this.appId);
		if (!config) return null;
		if (!config.icon && !config.iconSvg) return null;

		const useSvg = Boolean(config.iconSvg);
		const iconName = config.icon ?? "";
		const svgUrl = config.iconSvg ?? "";
		const size = this.size;

		return html`
			<div
				class="icon"
				aria-hidden="true"
				style="width: ${size}px; height: ${size}px"
			>
				${useSvg
					? html`<img src=${svgUrl} alt="" width=${size} height=${size} />`
					: iconName
						? html`
								<iconify-icon
									icon=${iconName}
									width=${size}
									height=${size}
									style="color: #4ec9b0"
								></iconify-icon>
							`
						: null}
			</div>
			${this.showLabel ? html`<span class="label">${config.label}</span>` : null}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"app-icon-widget": AppIconWidget;
	}
}
