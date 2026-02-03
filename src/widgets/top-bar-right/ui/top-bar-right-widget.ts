/**
 * Top Bar Right Widget
 *
 * GNOME-style top bar right section: locale switcher, system status icons,
 * and account menu. Composes locale-switcher-widget and features/auth account-menu.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import "../../../features/auth/ui/account-menu.ts";
import "../../locale-switcher/ui/locale-switcher-widget.ts";

@customElement("top-bar-right-widget")
export class TopBarRightWidget extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.system-icons {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.system-icons iconify-icon {
			display: block;
			opacity: 0.9;
		}
	`;

	override render() {
		return html`
			<locale-switcher-widget></locale-switcher-widget>
			<div class="system-icons" aria-hidden="true">
				<iconify-icon icon="lucide:volume-2" width="16" height="16"></iconify-icon>
				<iconify-icon icon="lucide:battery-medium" width="16" height="16"></iconify-icon>
				<iconify-icon icon="lucide:wifi" width="16" height="16"></iconify-icon>
			</div>
			<account-menu></account-menu>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"top-bar-right-widget": TopBarRightWidget;
	}
}
