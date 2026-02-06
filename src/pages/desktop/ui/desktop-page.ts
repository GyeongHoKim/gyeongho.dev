/**
 * Desktop Page
 *
 * Gnome Fedora Workstation-style desktop with top bar, desktop area,
 * and terminal window support. State and subscriptions are in DesktopStateController.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import "../../../widgets/menu/ui/menu-widget.ts";
import "../../../features/terminal/ui/terminal-app.ts";
import "../../../features/text-editor/ui/text-editor-app.ts";
import "../../../features/browser/ui/browser-app.ts";
import "../../../widgets/top-bar-right/ui/top-bar-right-widget.ts";
import "../../../widgets/dock/ui/dock-widget.ts";
import "../../../widgets/desktop-icons/ui/desktop-icons-widget.ts";
import "../../../widgets/desktop-background/ui/desktop-background.ts";
import "../../../features/resume-viewer/ui/resume-viewer.ts";
import {
	isAppVisible,
	getWindowZIndex,
} from "../../../shared/lib/window-store.js";
import { getVisitorFilesystem } from "../../../features/network-simulation/lib/network.ts";
import { DesktopStateController } from "../lib/desktop-state-controller.js";

@customElement("desktop-page")
export class DesktopPage extends LitElement {
	private readonly _state = new DesktopStateController(this);

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

	render() {
		const s = this._state;
		return html`
			<div class="desktop-root">
				<desktop-background></desktop-background>
				<div class="top-bar">
				<div class="top-bar-left">
					<button class="activities-button" @click=${() => s.toggleMenu()}>
						${msg("Activities", { desc: "Top bar menu button" })}
					</button>
				</div>
				<div class="top-bar-center">
					${s.getCurrentTime()}
				</div>
				<div class="top-bar-right">
					<top-bar-right-widget></top-bar-right-widget>
				</div>
			</div>

			<div class="desktop-area" @window-focus=${(e: Event) => s.handleWindowFocus(e)}>
				<desktop-icons-widget></desktop-icons-widget>
				${
					s.menuOpen
						? html`
					<menu-widget
						@open-terminal=${() => s.openTerminal()}
						@open-browser=${() => s.openBrowser()}
						@close-menu=${() => s.closeMenu()}
					></menu-widget>
					`
						: null
				}

				${
					isAppVisible("terminal")
						? html`
						<div
							class="window-container"
							data-app-id="terminal"
							style="z-index: ${getWindowZIndex("terminal")}"
						>
							<terminal-app @resume-revealed=${() => s.setResumeRevealed()}></terminal-app>
						</div>
					`
						: null
				}

				${
					isAppVisible("text-editor")
						? html`
						<div
							class="window-container"
							data-app-id="text-editor"
							style="transform: translate(-40%, -40%); z-index: ${getWindowZIndex("text-editor")}"
						>
							<text-editor-app
								.filesystem=${getVisitorFilesystem()}
								.cwd=${s.editorCwd}
								.initialFile=${s.editorFile}
								@resume-revealed=${() => s.setResumeRevealed()}
							></text-editor-app>
						</div>
					`
						: null
				}

				${
					isAppVisible("browser")
						? html`
						<div
							class="window-container"
							data-app-id="browser"
							style="transform: translate(-30%, -50%); z-index: ${getWindowZIndex("browser")}"
						>
							<browser-app @resume-revealed=${() => s.setResumeRevealed()}></browser-app>
						</div>
					`
						: null
				}

				${
					!isAppVisible("terminal") &&
					!isAppVisible("text-editor") &&
					!isAppVisible("browser")
						? html`
						<div class="welcome-text">
							<h2>${msg("Welcome to gyeongho.dev", { desc: "Desktop welcome heading" })}</h2>
							<p>${msg('Click "Activities" to open the terminal and start exploring', { desc: "Desktop welcome hint" })}</p>
						</div>
					`
						: null
				}
				</div>

				${
					s.resumeVisible
						? html`
					<div class="resume-overlay" @click=${() => s.closeResume()}>
						<resume-viewer @close=${() => s.closeResume()}></resume-viewer>
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
