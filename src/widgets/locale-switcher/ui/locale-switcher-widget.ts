/**
 * Locale Switcher Widget
 *
 * Language selector: trigger button + dropdown with locale list.
 * Listens to lit-localize-status and uses setLocaleAndSave.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import { getLocale, setLocaleAndSave } from "../../../lib/localization.ts";
import {
	sourceLocale,
	targetLocales,
} from "../../../generated/locale-codes.ts";

const LOCALE_LABELS: Record<string, string> = {
	en: "English",
	ko: "한국어",
	ja: "日本語",
};

@customElement("locale-switcher-widget")
export class LocaleSwitcherWidget extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
		}

		.locale-trigger {
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 4px 8px;
			background: none;
			border: none;
			border-radius: 4px;
			color: rgba(255, 255, 255, 0.9);
			font-size: 13px;
			font-family: inherit;
			cursor: pointer;
		}

		.locale-trigger:hover {
			background: rgba(255, 255, 255, 0.08);
		}

		.locale-dropdown {
			position: absolute;
			top: 100%;
			right: 0;
			margin-top: 4px;
			min-width: 120px;
			background: rgba(40, 40, 40, 0.98);
			border-radius: 8px;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
			z-index: 200;
			overflow: hidden;
		}

		.locale-dropdown button {
			display: block;
			width: 100%;
			padding: 8px 12px;
			background: none;
			border: none;
			color: inherit;
			font-size: 13px;
			font-family: inherit;
			text-align: left;
			cursor: pointer;
		}

		.locale-dropdown button:hover {
			background: rgba(255, 255, 255, 0.08);
		}
	`;

	@state() private _locale = getLocale();
	@state() private _localeOpen = false;

	private _boundClose = this._closeLocaleMenu.bind(this);

	override connectedCallback(): void {
		super.connectedCallback();
		window.addEventListener(
			"lit-localize-status",
			this._onLocaleStatus.bind(this),
		);
	}

	override disconnectedCallback(): void {
		window.removeEventListener(
			"lit-localize-status",
			this._onLocaleStatus.bind(this),
		);
		document.removeEventListener("click", this._boundClose);
		super.disconnectedCallback();
	}

	private _onLocaleStatus(
		e: CustomEvent<{ status: string; readyLocale?: string }>,
	): void {
		if (e.detail.status === "ready" && e.detail.readyLocale) {
			this._locale = e.detail.readyLocale;
		}
	}

	private _toggleLocale(): void {
		this._localeOpen = !this._localeOpen;
		if (this._localeOpen) {
			setTimeout(() => document.addEventListener("click", this._boundClose), 0);
		} else {
			document.removeEventListener("click", this._boundClose);
		}
	}

	private _closeLocaleMenu(): void {
		this._localeOpen = false;
		document.removeEventListener("click", this._boundClose);
	}

	private async _selectLocale(locale: string): Promise<void> {
		this._closeLocaleMenu();
		await setLocaleAndSave(locale);
	}

	override render() {
		const allLocales = [sourceLocale, ...targetLocales];
		return html`
			<button
				type="button"
				class="locale-trigger"
				aria-haspopup="true"
				aria-expanded="${this._localeOpen}"
				aria-label="${msg("Language", { desc: "Locale switcher" })}"
				@click=${this._toggleLocale}
			>
				<iconify-icon
					icon="lucide:languages"
					width="16"
					height="16"
					aria-hidden="true"
				></iconify-icon>
				<span>${LOCALE_LABELS[this._locale] ?? this._locale}</span>
			</button>
			${this._localeOpen
				? html`
						<div class="locale-dropdown" role="menu">
							${allLocales.map(
								(locale) =>
									html`
										<button
											type="button"
											role="menuitem"
											?aria-current="${this._locale === locale}"
											@click=${() => this._selectLocale(locale)}
										>
											${LOCALE_LABELS[locale] ?? locale}
										</button>
									`,
							)}
						</div>
					`
				: null}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"locale-switcher-widget": LocaleSwitcherWidget;
	}
}
