/**
 * Mobile Terminus Page — full-screen terminal styled as the iOS Terminus app.
 * Uses the same TerminalController as the desktop terminal.
 * Has an iOS-style navigation bar at top and a quick-command toolbar above the keyboard.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "iconify-icon";
import { TerminalController } from "../../../features/terminal/lib/terminal-controller.ts";
import "../../../widgets/ios-status-bar/ui/ios-status-bar.ts";

@customElement("mobile-terminus-page")
export class MobileTerminusPage extends LitElement {
	private readonly _terminal = new TerminalController(this);
	@state() private _showToolbar = true;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100vh;
			height: 100dvh;
			background: #000;
			position: relative;
			overflow: hidden;
		}

		.terminus {
			display: flex;
			flex-direction: column;
			height: 100%;
		}

		/* iOS-style navigation bar */
		.nav-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 16px;
			height: 44px;
			background: #1c1c1e;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			flex-shrink: 0;
		}

		.nav-back {
			display: flex;
			align-items: center;
			gap: 4px;
			background: none;
			border: none;
			color: #0a84ff;
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 17px;
			cursor: pointer;
			padding: 4px 0;
			-webkit-tap-highlight-color: transparent;
		}

		.nav-back:active {
			opacity: 0.5;
		}

		.nav-title {
			font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
			font-size: 17px;
			font-weight: 600;
			color: #fff;
		}

		.nav-actions {
			display: flex;
			gap: 16px;
		}

		.nav-action-btn {
			background: none;
			border: none;
			color: #0a84ff;
			cursor: pointer;
			padding: 4px;
			-webkit-tap-highlight-color: transparent;
		}

		.nav-action-btn:active {
			opacity: 0.5;
		}

		/* Terminal area */
		.terminal-area {
			flex: 1;
			background: #1e1e1e;
			padding: 4px 4px 0 4px;
			overflow: hidden;
			min-height: 0;
		}

		.terminal-container {
			width: 100%;
			height: 100%;
			overflow: hidden;
		}

		/* Quick-command toolbar above keyboard */
		.quick-toolbar {
			display: flex;
			align-items: center;
			gap: 2px;
			padding: 6px 8px;
			background: #2c2c2e;
			border-top: 1px solid rgba(255, 255, 255, 0.1);
			overflow-x: auto;
			flex-shrink: 0;
			-webkit-overflow-scrolling: touch;
		}

		.quick-toolbar::-webkit-scrollbar {
			display: none;
		}

		.quick-btn {
			flex-shrink: 0;
			padding: 6px 12px;
			background: #3a3a3c;
			border: none;
			border-radius: 6px;
			color: #fff;
			font-family: "Cascadia Code", "Fira Code", monospace;
			font-size: 13px;
			cursor: pointer;
			-webkit-tap-highlight-color: transparent;
		}

		.quick-btn:active {
			background: #4a4a4c;
		}

		@media (prefers-reduced-motion: reduce) {
			.nav-back:active,
			.nav-action-btn:active,
			.quick-btn:active {
				opacity: 1;
			}
		}
	`;

	protected override firstUpdated(): void {
		const container = this.shadowRoot?.querySelector(
			".terminal-container",
		) as HTMLElement;
		if (container) {
			this._terminal.init(container, { fontSize: 12 });
		}
	}

	private _goHome(): void {
		this.dispatchEvent(
			new CustomEvent("go-home", { bubbles: true, composed: true }),
		);
	}

	private _sendQuickCommand(cmd: string): void {
		this._terminal.sendInput(cmd);
	}

	private _getQuickCommands(): Array<{ label: string; cmd: string }> {
		return [
			{ label: "help", cmd: "help\r" },
			{ label: "ls", cmd: "ls\r" },
			{ label: "cd", cmd: "cd " },
			{ label: "ssh", cmd: "ssh " },
			{ label: "nmap", cmd: "nmap " },
			{ label: "cat", cmd: "cat " },
			{ label: "Tab", cmd: "\t" },
			{ label: "Ctrl+C", cmd: "\x03" },
		];
	}

	render() {
		return html`
			<div class="terminus">
				<ios-status-bar variant="light"></ios-status-bar>

				<div class="nav-bar">
					<button class="nav-back" @click=${this._goHome}>
						<iconify-icon icon="lucide:chevron-left" width="20" height="20" aria-hidden="true"></iconify-icon>
						${msg("Home", { desc: "Terminus back button" })}
					</button>
					<span class="nav-title">Terminus</span>
					<div class="nav-actions">
						<button class="nav-action-btn" aria-label="New session">
							<iconify-icon icon="lucide:plus" width="20" height="20" aria-hidden="true"></iconify-icon>
						</button>
					</div>
				</div>

				<div class="terminal-area">
					<link
						rel="stylesheet"
						href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css"
					/>
					<div class="terminal-container"></div>
				</div>

				${
					this._showToolbar
						? html`
						<div class="quick-toolbar">
							${this._getQuickCommands().map(
								(qc) => html`
									<button
										class="quick-btn"
										@click=${() => this._sendQuickCommand(qc.cmd)}
									>${qc.label}</button>
								`,
							)}
						</div>
					`
						: null
				}
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"mobile-terminus-page": MobileTerminusPage;
	}
}
