/**
 * Terminal Widget
 *
 * xterm.js-powered terminal with command interpreter integration.
 * Session state resets on close/reopen per U1 specification.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { createSession } from "../../../entities/session/model/session.ts";
import type { Session } from "../../../entities/session/model/session.ts";
import { createDefaultFilesystem } from "../../../entities/virtual-filesystem/lib/create-default-fs.ts";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import { executeCommand } from "../lib/command-interpreter.ts";

@customElement("terminal-widget")
export class TerminalWidget extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.window {
			background: #2d2d2d;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
			width: 800px;
			height: 500px;
			display: flex;
			flex-direction: column;
			transition: width 0.2s ease, height 0.2s ease, border-radius 0.2s ease;
		}

		.window.maximized {
			width: 100vw;
			height: calc(100vh - 32px);
			border-radius: 0;
		}

		.window.minimized {
			display: none;
		}

		.title-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			height: 36px;
			background: #383838;
			padding: 0 12px;
			user-select: none;
			cursor: grab;
		}

		.title-bar:active {
			cursor: grabbing;
		}

		.window.maximized .title-bar {
			cursor: default;
		}

		.window-controls {
			display: flex;
			gap: 8px;
		}

		.window-control {
			width: 12px;
			height: 12px;
			border-radius: 50%;
			border: none;
			cursor: pointer;
		}

		.close {
			background: #ff5f56;
		}

		.close:hover {
			background: #ff3b30;
		}

		.window-control:focus-visible {
			outline: 2px solid #fff;
			outline-offset: 2px;
		}

		.minimize {
			background: #ffbd2e;
		}

		.minimize:hover {
			background: #f5a623;
		}

		.maximize {
			background: #27ca40;
		}

		.maximize:hover {
			background: #1db954;
		}

		.title {
			color: #ccc;
			font-size: 13px;
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
		}

		.terminal-container {
			flex: 1;
			padding: 8px;
			background: #1e1e1e;
			overflow: hidden;
		}

		/* Import xterm.js styles */
		.xterm {
			height: 100%;
		}
	`;

	@state()
	private session: Session = createSession();

	@state()
	private isMaximized = false;

	@state()
	private posX = 0;

	@state()
	private posY = 0;

	private terminal: Terminal | null = null;
	private fitAddon: FitAddon | null = null;
	private fs: VirtualFilesystem = createDefaultFilesystem();
	private currentLine = "";
	private isWaitingForPassword = false;
	private pendingSudoCommand = "";

	// Drag state
	private isDragging = false;
	private dragStartX = 0;
	private dragStartY = 0;
	private dragStartPosX = 0;
	private dragStartPosY = 0;

	private handleClose() {
		this.dispatchEvent(new CustomEvent("close-terminal"));
	}

	private handleMinimize() {
		this.dispatchEvent(new CustomEvent("minimize-terminal"));
	}

	private handleMaximize() {
		this.isMaximized = !this.isMaximized;
		// Reset position when maximizing
		if (this.isMaximized) {
			this.posX = 0;
			this.posY = 0;
		}
		// Refit terminal after size change
		setTimeout(() => {
			this.fitAddon?.fit();
		}, 100);
	}

	private handleDragStart(e: MouseEvent) {
		// Don't drag if maximized or if clicking on buttons
		if (this.isMaximized) return;
		if ((e.target as HTMLElement).closest(".window-controls")) return;

		this.isDragging = true;
		this.dragStartX = e.clientX;
		this.dragStartY = e.clientY;
		this.dragStartPosX = this.posX;
		this.dragStartPosY = this.posY;

		// Prevent text selection during drag
		document.body.style.userSelect = "none";

		// Add global listeners
		document.addEventListener("mousemove", this.handleDragMove);
		document.addEventListener("mouseup", this.handleDragEnd);
	}

	private handleDragMove = (e: MouseEvent) => {
		if (!this.isDragging) return;

		const deltaX = e.clientX - this.dragStartX;
		const deltaY = e.clientY - this.dragStartY;

		this.posX = this.dragStartPosX + deltaX;
		this.posY = this.dragStartPosY + deltaY;
	};

	private handleDragEnd = () => {
		this.isDragging = false;
		document.body.style.userSelect = "";

		// Remove global listeners
		document.removeEventListener("mousemove", this.handleDragMove);
		document.removeEventListener("mouseup", this.handleDragEnd);
	};

	protected firstUpdated() {
		this.initTerminal();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.terminal?.dispose();
		// Clean up drag listeners
		document.removeEventListener("mousemove", this.handleDragMove);
		document.removeEventListener("mouseup", this.handleDragEnd);
	}

	private initTerminal() {
		const container = this.shadowRoot?.querySelector(
			".terminal-container",
		) as HTMLElement;
		if (!container) return;

		// Reset session on each terminal open (per U1 spec)
		this.session = createSession();
		this.fs = createDefaultFilesystem();
		this.currentLine = "";

		this.terminal = new Terminal({
			cursorBlink: true,
			theme: {
				background: "#1e1e1e",
				foreground: "#d4d4d4",
				cursor: "#d4d4d4",
				black: "#1e1e1e",
				red: "#f44747",
				green: "#4ec9b0",
				yellow: "#dcdcaa",
				blue: "#569cd6",
				magenta: "#c586c0",
				cyan: "#9cdcfe",
				white: "#d4d4d4",
			},
			fontFamily: '"Cascadia Code", "Fira Code", monospace',
			fontSize: 14,
			lineHeight: 1.2,
		});

		this.fitAddon = new FitAddon();
		this.terminal.loadAddon(this.fitAddon);
		this.terminal.open(container);

		// Fit terminal to container
		setTimeout(() => {
			this.fitAddon?.fit();
		}, 0);

		// Welcome message
		this.terminal.writeln("Welcome to gyeongho.dev terminal");
		this.terminal.writeln('Type "help" for available commands.');
		this.terminal.writeln("");
		this.writePrompt();

		// Handle input
		this.terminal.onData((data) => this.handleInput(data));

		// Handle resize
		new ResizeObserver(() => {
			this.fitAddon?.fit();
		}).observe(container);
	}

	private writePrompt() {
		const prompt = `visitor@desktop:${this.session.cwd}$ `;
		this.terminal?.write(prompt);
	}

	private async handleInput(data: string) {
		if (!this.terminal) return;

		// Handle password input mode
		if (this.isWaitingForPassword) {
			if (data === "\r") {
				// Enter pressed - process password
				this.terminal.writeln("");
				await this.processSudoWithPassword(this.currentLine);
				this.currentLine = "";
				this.isWaitingForPassword = false;
				return;
			}
			if (data === "\x7f") {
				// Backspace - don't echo but remove from buffer
				if (this.currentLine.length > 0) {
					this.currentLine = this.currentLine.slice(0, -1);
				}
				return;
			}
			if (data === "\x03") {
				// Ctrl+C
				this.terminal.writeln("^C");
				this.currentLine = "";
				this.isWaitingForPassword = false;
				this.pendingSudoCommand = "";
				this.writePrompt();
				return;
			}
			// Don't echo password characters
			this.currentLine += data;
			return;
		}

		// Normal input handling
		if (data === "\r") {
			// Enter pressed
			this.terminal.writeln("");
			await this.processCommand(this.currentLine);
			this.currentLine = "";
		} else if (data === "\x7f") {
			// Backspace
			if (this.currentLine.length > 0) {
				this.currentLine = this.currentLine.slice(0, -1);
				this.terminal.write("\b \b");
			}
		} else if (data === "\x03") {
			// Ctrl+C
			this.terminal.writeln("^C");
			this.currentLine = "";
			this.writePrompt();
		} else if (data >= " ") {
			// Regular printable characters
			this.currentLine += data;
			this.terminal.write(data);
		}
	}

	/**
	 * Normalizes line endings for terminal output.
	 * Converts \n to \r\n for proper xterm.js display.
	 */
	private normalizeLineEndings(text: string): string {
		return text.replace(/\r?\n/g, "\r\n");
	}

	private async processCommand(line: string) {
		const trimmed = line.trim();

		if (!trimmed) {
			this.writePrompt();
			return;
		}

		// Check if this is a sudo command that needs password
		if (trimmed.startsWith("sudo ") && !this.session.sudoAuthenticated) {
			this.pendingSudoCommand = trimmed.slice(5).trim();
			this.terminal?.write("[sudo] password for visitor: ");
			this.isWaitingForPassword = true;
			return;
		}

		const result = await executeCommand(trimmed, {
			fs: this.fs,
			session: this.session,
		});

		// Apply session updates
		if (result.sessionUpdates) {
			this.session = { ...this.session, ...result.sessionUpdates };
		}

		// Write output (normalize line endings for xterm.js)
		if (result.result.stdout) {
			this.terminal?.writeln(this.normalizeLineEndings(result.result.stdout));
		}
		if (result.result.stderr) {
			this.terminal?.writeln(`\x1b[31m${this.normalizeLineEndings(result.result.stderr)}\x1b[0m`);
		}

		// Check if resume was revealed
		if (result.result.resumeRevealed) {
			this.dispatchEvent(new CustomEvent("resume-revealed"));
		}

		this.writePrompt();
	}

	private async processSudoWithPassword(password: string) {
		const SUDO_PASSWORD = "1116";

		if (password !== SUDO_PASSWORD) {
			this.terminal?.writeln("\x1b[31mSorry, try again.\x1b[0m");
			this.writePrompt();
			return;
		}

		// Password correct - mark as authenticated and run the command
		this.session = { ...this.session, sudoAuthenticated: true };

		if (this.pendingSudoCommand) {
			const result = await executeCommand(this.pendingSudoCommand, {
				fs: this.fs,
				session: this.session,
			});

			// Apply session updates
			if (result.sessionUpdates) {
				this.session = { ...this.session, ...result.sessionUpdates };
			}

			// Write output (normalize line endings for xterm.js)
			if (result.result.stdout) {
				this.terminal?.writeln(this.normalizeLineEndings(result.result.stdout));
			}
			if (result.result.stderr) {
				this.terminal?.writeln(`\x1b[31m${this.normalizeLineEndings(result.result.stderr)}\x1b[0m`);
			}

			// Check if resume was revealed
			if (result.result.resumeRevealed) {
				this.dispatchEvent(new CustomEvent("resume-revealed"));
			}
		}

		this.pendingSudoCommand = "";
		this.writePrompt();
	}

	render() {
		return html`
			<link
				rel="stylesheet"
				href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css"
			/>
			<div
				class="window ${this.isMaximized ? "maximized" : ""}"
				style="${this.isMaximized ? "" : `transform: translate(${this.posX}px, ${this.posY}px)`}"
			>
				<div class="title-bar" @mousedown=${this.handleDragStart}>
					<div class="window-controls">
						<button class="window-control close" @click=${this.handleClose} aria-label="Close terminal"></button>
						<button class="window-control minimize" @click=${this.handleMinimize} aria-label="Minimize terminal"></button>
						<button class="window-control maximize" @click=${this.handleMaximize} aria-label="${this.isMaximized ? "Restore terminal" : "Maximize terminal"}"></button>
					</div>
					<span class="title">Terminal</span>
					<div></div>
				</div>
				<div class="terminal-container"></div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"terminal-widget": TerminalWidget;
	}
}
