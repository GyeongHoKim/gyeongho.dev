/**
 * Desktop Page
 *
 * Gnome Fedora Workstation-style desktop with top bar, desktop area,
 * and terminal window support.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import "iconify-icon";
import "../../../widgets/menu/ui/menu-widget.ts";
import "../../../widgets/terminal/ui/terminal-widget.ts";
import "../../../features/resume-viewer/ui/resume-viewer.ts";

@customElement("desktop-page")
export class DesktopPage extends LitElement {
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
			overflow: hidden;
			font-family: "Cantarell", "Segoe UI", sans-serif;
		}

		.top-bar {
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
			gap: 12px;
		}

		.system-icons {
			display: flex;
			gap: 8px;
		}

		.desktop-area {
			position: relative;
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

		.dock {
			position: fixed;
			bottom: 8px;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			gap: 8px;
			padding: 8px 12px;
			background: rgba(40, 40, 40, 0.9);
			border-radius: 12px;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		}

		.dock-item {
			width: 48px;
			height: 48px;
			border-radius: 10px;
			border: none;
			background: rgba(255, 255, 255, 0.1);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: transform 0.15s ease, background 0.15s ease;
		}

		.dock-item:hover {
			background: rgba(255, 255, 255, 0.2);
			transform: scale(1.1);
		}

		.dock-item:focus-visible {
			outline: 2px solid #3584e4;
			outline-offset: 2px;
		}

		.dock-item.active {
			background: rgba(53, 132, 228, 0.4);
		}

		.dock-item.minimized::after {
			content: "";
			position: absolute;
			bottom: 4px;
			width: 6px;
			height: 6px;
			background: #ffbd2e;
			border-radius: 50%;
		}
	`;

	@state()
	private terminalOpen = false;

	@state()
	private terminalMinimized = false;

	@state()
	private menuOpen = false;

	@state()
	private resumeVisible = false;

	private handleMenuToggle() {
		this.menuOpen = !this.menuOpen;
	}

	private handleCloseMenu() {
		this.menuOpen = false;
	}

	private handleOpenTerminal() {
		if (this.terminalMinimized) {
			// Restore minimized terminal
			this.terminalMinimized = false;
		} else {
			this.terminalOpen = true;
		}
		this.menuOpen = false;
	}

	private handleCloseTerminal() {
		this.terminalOpen = false;
		this.terminalMinimized = false;
	}

	private handleMinimizeTerminal() {
		this.terminalMinimized = true;
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
			<div class="top-bar">
				<div class="top-bar-left">
					<button class="activities-button" @click=${this.handleMenuToggle}>
						Activities
					</button>
				</div>
				<div class="top-bar-center">
					${this.getCurrentTime()}
				</div>
				<div class="top-bar-right">
					<div class="system-icons">
						<iconify-icon icon="lucide:volume-2" width="16" height="16" aria-hidden="true"></iconify-icon>
						<iconify-icon icon="lucide:battery-medium" width="16" height="16" aria-hidden="true"></iconify-icon>
						<iconify-icon icon="lucide:wifi" width="16" height="16" aria-hidden="true"></iconify-icon>
					</div>
				</div>
			</div>

			<div class="desktop-area">
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
					this.terminalOpen && !this.terminalMinimized
						? html`
						<div class="window-container">
							<terminal-widget
								@close-terminal=${this.handleCloseTerminal}
								@minimize-terminal=${this.handleMinimizeTerminal}
								@resume-revealed=${this.handleResumeRevealed}
							></terminal-widget>
						</div>
					`
						: html`
						<div class="welcome-text">
							<h2>Welcome to gyeongho.dev</h2>
							<p>Click "Activities" to open the terminal and start exploring</p>
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

			${
				this.terminalOpen
					? html`
					<div class="dock">
						<button
							class="dock-item ${this.terminalMinimized ? "minimized" : "active"}"
							@click=${this.handleOpenTerminal}
							aria-label="${this.terminalMinimized ? "Restore Terminal" : "Terminal is open"}"
						>
							<iconify-icon icon="lucide:terminal" width="24" height="24" style="color: #4ec9b0" aria-hidden="true"></iconify-icon>
						</button>
					</div>
				`
					: null
			}
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"desktop-page": DesktopPage;
	}
}
