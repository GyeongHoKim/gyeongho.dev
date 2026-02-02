/**
 * Desktop Page
 *
 * Gnome Fedora Workstation-style desktop with top bar, desktop area,
 * and terminal window support.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import "../../../widgets/menu/ui/menu-widget.ts";
import "../../../features/terminal/ui/terminal-app.ts";
import "../../../widgets/top-bar-right/ui/top-bar-right-widget.ts";
import "../../../widgets/dock/ui/dock-widget.ts";
import "../../../widgets/desktop-icons/ui/desktop-icons-widget.ts";
import "../../../widgets/desktop-background/ui/desktop-background.ts";
import "../../../features/resume-viewer/ui/resume-viewer.ts";
import {
	openApp,
	isAppVisible,
	subscribeWindowStore,
} from "../../../shared/lib/window-store.js";

@customElement("desktop-page")
export class DesktopPage extends LitElement {
	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			overflow: hidden;
			font-family: "Cantarell", "Segoe UI", sans-serif;
		}

		.desktop-root {
			position: relative;
			width: 100%;
			height: 100%;
		}

		.top-bar {
			position: relative;
			z-index: 1;
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 32px;
			background: rgba(0, 0, 0, 0.75);
			padding: 0 12px;
			color: #fff;
			font-size: 14px;
		}

		.top-bar-left {
			display: flex;
			align-items: center;
			gap: 16px;
		}

		.activities-button {
			background: none;
			border: none;
			color: #fff;
			cursor: pointer;
			padding: 4px 12px;
			border-radius: 4px;
			font-size: 14px;
			font-family: inherit;
		}

		.activities-button:hover {
			background: rgba(255, 255, 255, 0.1);
		}

		.activities-button:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.top-bar-center {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		.top-bar-right {
			display: flex;
			align-items: center;
		}

		.desktop-area {
			position: relative;
			z-index: 1;
			width: 100%;
			height: calc(100vh - 32px);
		}

		.window-container {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}

		.welcome-text {
			position: absolute;
			bottom: 40px;
			left: 50%;
			transform: translateX(-50%);
			color: rgba(255, 255, 255, 0.7);
			font-size: 16px;
			text-align: center;
		}

		.welcome-text h2 {
			font-weight: 400;
			margin: 0 0 8px 0;
		}

		.welcome-text p {
			margin: 0;
			opacity: 0.8;
			font-size: 14px;
		}

		.resume-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
		}
	`;

	@state()
	private menuOpen = false;

	@state()
	private resumeVisible = false;

	private unsubscribe: (() => void) | null = null;

	override connectedCallback() {
		super.connectedCallback();
		this.unsubscribe = subscribeWindowStore(() => this.requestUpdate());
	}

	override disconnectedCallback() {
		this.unsubscribe?.();
		super.disconnectedCallback();
	}

	private handleMenuToggle() {
		this.menuOpen = !this.menuOpen;
	}

	private handleCloseMenu() {
		this.menuOpen = false;
	}

	private handleOpenTerminal() {
		openApp("terminal");
		this.menuOpen = false;
	}

	private handleResumeRevealed() {
		this.resumeVisible = true;
	}

	private handleCloseResume() {
		this.resumeVisible = false;
	}

	private getCurrentTime(): string {
		const now = new Date();
		return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	render() {
		return html`
			<div class="desktop-root">
				<desktop-background></desktop-background>
				<div class="top-bar">
				<div class="top-bar-left">
					<button class="activities-button" @click=${this.handleMenuToggle}>
						${msg("Activities", { desc: "Top bar menu button" })}
					</button>
				</div>
				<div class="top-bar-center">
					${this.getCurrentTime()}
				</div>
				<div class="top-bar-right">
					<top-bar-right-widget></top-bar-right-widget>
				</div>
			</div>

			<div class="desktop-area">
				<desktop-icons-widget></desktop-icons-widget>
				${
					this.menuOpen
						? html`
					<menu-widget
						@open-terminal=${this.handleOpenTerminal}
						@close-menu=${this.handleCloseMenu}
					></menu-widget>
					`
						: null
				}

				${
					isAppVisible("terminal")
						? html`
						<div class="window-container">
							<terminal-app @resume-revealed=${this.handleResumeRevealed}></terminal-app>
						</div>
					`
						: html`
						<div class="welcome-text">
							<h2>${msg("Welcome to gyeongho.dev", { desc: "Desktop welcome heading" })}</h2>
							<p>${msg('Click "Activities" to open the terminal and start exploring', { desc: "Desktop welcome hint" })}</p>
						</div>
					`
				}
				</div>

				${
					this.resumeVisible
					? html`
					<div class="resume-overlay" @click=${this.handleCloseResume}>
						<resume-viewer @close=${this.handleCloseResume}></resume-viewer>
					</div>
				`
					: null
			}

				<dock-widget></dock-widget>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"desktop-page": DesktopPage;
	}
}
