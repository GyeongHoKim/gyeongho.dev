/**
 * Terminal App
 *
 * Terminal feature: xterm.js and command interpreter.
 * Uses TerminalController for session, fs, and input/command logic; floating-window for chrome.
 */

import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import { TerminalController } from "../lib/terminal-controller.ts";
import "../../../widgets/floating-window/ui/floating-window.ts";
import { setMinimized, closeApp } from "../../../shared/lib/window-store.js";

@customElement("terminal-app")
export class TerminalApp extends LitElement {
	private readonly _terminal = new TerminalController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	static styles = css`
		:host {
			display: block;
		}

		.terminal-content {
			flex: 1;
			padding: 8px;
			background: #1e1e1e;
			overflow: hidden;
			display: flex;
			flex-direction: column;
		}

		.terminal-container {
			flex: 1;
			min-height: 0;
			overflow: hidden;
		}

		.xterm {
			height: 100%;
		}
	`;

	protected override firstUpdated(): void {
		const container = this.shadowRoot?.querySelector(
			".terminal-container",
		) as HTMLElement;
		if (container) {
			this._terminal.init(container);
		}
	}

	override render() {
		return html`
			<link
				rel="stylesheet"
				href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css"
			/>
			<floating-window
				title=${msg("Terminal", { desc: "Window title" })}
				@window-minimize=${() => setMinimized("terminal", true)}
				@window-close=${() => closeApp("terminal")}
			>
				<div slot="content" class="terminal-content">
					<div class="terminal-container"></div>
				</div>
			</floating-window>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"terminal-app": TerminalApp;
	}
}
