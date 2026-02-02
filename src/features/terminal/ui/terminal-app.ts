/**
 * Terminal App
 *
 * Terminal feature: xterm.js and command interpreter only.
 * Uses floating-window for window chrome; icon and window events are customizable.
 */

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { msg, str, updateWhenLocaleChanges } from "@lit/localize";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { setVisitor } from "../../../shared/lib/auth-store.js";
import { createSession } from "../../../entities/session/model/session.ts";
import type { Session } from "../../../entities/session/model/session.ts";
import { createDefaultFilesystem } from "../../../entities/virtual-filesystem/lib/create-default-fs.ts";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import { executeCommand } from "../lib/command-interpreter.ts";
import {
	getNetwork,
	initializeNetwork,
} from "../../network-simulation/lib/network.ts";
import { getDeviceByIp } from "../../network-simulation/model/types.ts";
import "../../../widgets/floating-window/ui/floating-window.ts";
import {
	setMinimized,
	closeApp,
} from "../../../shared/lib/window-store.js";

@customElement("terminal-app")
export class TerminalApp extends LitElement {
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

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	@state() private session: Session = createSession();
	private terminal: Terminal | null = null;
	private fitAddon: FitAddon | null = null;
	private fs: VirtualFilesystem = createDefaultFilesystem();
	private currentLine = "";
	private isWaitingForPassword = false;
	private isWaitingForSshPassword = false;
	private pendingSudoCommand = "";
	private pendingSshConnection: {
		ip: string;
		user: "visitor" | "gyeonghokim";
	} | null = null;

	private getConnectedFilesystem(): VirtualFilesystem {
		const network = getNetwork();
		const device = getDeviceByIp(network, this.session.connectedDeviceIp);
		if (!device) return createDefaultFilesystem();
		return device.fs;
	}

	private updateFilesystem() {
		this.fs = this.getConnectedFilesystem();
	}

	protected override firstUpdated() {
		this.initTerminal();
	}

	override disconnectedCallback() {
		super.disconnectedCallback();
		this.terminal?.dispose();
	}

	private initTerminal() {
		const container = this.shadowRoot?.querySelector(
			".terminal-container",
		) as HTMLElement;
		if (!container) return;

		initializeNetwork();

		const baseSession = createSession();
		this.session = { ...baseSession, currentUser: "visitor" };
		this.updateFilesystem();
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

		setTimeout(() => this.fitAddon?.fit(), 0);

		this.terminal.writeln(
			msg("Welcome to gyeongho.dev terminal", { desc: "Terminal welcome" }),
		);
		this.terminal.writeln(
			msg('Type "help" for available commands.', { desc: "Terminal hint" }),
		);
		this.terminal.writeln("");
		this.writePrompt();

		this.terminal.onData((data) => this.handleInput(data));

		new ResizeObserver(() => this.fitAddon?.fit()).observe(container);
	}

	private writePrompt() {
		const network = getNetwork();
		const device = getDeviceByIp(network, this.session.connectedDeviceIp);
		const hostname = device?.hostname || "unknown";
		const prompt = `${this.session.currentUser}@${hostname}:${this.session.cwd}$ `;
		this.terminal?.write(prompt);
	}

	private async handleInput(data: string) {
		if (!this.terminal) return;

		if (this.isWaitingForSshPassword) {
			if (data === "\r") {
				this.terminal.writeln("");
				const password = this.currentLine;
				this.currentLine = "";
				this.isWaitingForSshPassword = false;
				await this.processSshWithPassword(password);
				return;
			}
			if (data === "\x7f") {
				if (this.currentLine.length > 0)
					this.currentLine = this.currentLine.slice(0, -1);
				return;
			}
			if (data === "\x03") {
				this.terminal.writeln("^C");
				this.currentLine = "";
				this.isWaitingForSshPassword = false;
				this.pendingSshConnection = null;
				this.writePrompt();
				return;
			}
			this.currentLine += data;
			return;
		}

		if (this.isWaitingForPassword) {
			if (data === "\r") {
				this.terminal.writeln("");
				await this.processSudoWithPassword(this.currentLine);
				this.currentLine = "";
				this.isWaitingForPassword = false;
				return;
			}
			if (data === "\x7f") {
				if (this.currentLine.length > 0)
					this.currentLine = this.currentLine.slice(0, -1);
				return;
			}
			if (data === "\x03") {
				this.terminal.writeln("^C");
				this.currentLine = "";
				this.isWaitingForPassword = false;
				this.pendingSudoCommand = "";
				this.writePrompt();
				return;
			}
			this.currentLine += data;
			return;
		}

		if (data === "\r") {
			this.terminal.writeln("");
			await this.processCommand(this.currentLine);
			this.currentLine = "";
		} else if (data === "\x7f") {
			if (this.currentLine.length > 0) {
				this.currentLine = this.currentLine.slice(0, -1);
				this.terminal.write("\b \b");
			}
		} else if (data === "\x03") {
			this.terminal.writeln("^C");
			this.currentLine = "";
			this.writePrompt();
		} else if (data >= " ") {
			this.currentLine += data;
			this.terminal.write(data);
		}
	}

	private normalizeLineEndings(text: string): string {
		return text.replace(/\r?\n/g, "\r\n");
	}

	private async processCommand(line: string) {
		const trimmed = line.trim();
		if (!trimmed) {
			this.writePrompt();
			return;
		}

		if (trimmed.startsWith("sudo ") && !this.session.sudoAuthenticated) {
			this.pendingSudoCommand = trimmed.slice(5).trim();
			this.terminal?.write(
				msg(str`[sudo] password for ${this.session.currentUser}: `, {
					desc: "Terminal sudo prompt",
				}),
			);
			this.isWaitingForPassword = true;
			return;
		}

		const result = await executeCommand(trimmed, {
			fs: this.fs,
			session: this.session,
		});

		if (result.needsSshPassword) {
			this.pendingSshConnection = result.needsSshPassword;
			this.terminal?.write(msg("password: ", { desc: "SSH password prompt" }));
			this.isWaitingForSshPassword = true;
			return;
		}

		if (result.sessionUpdates) {
			this.session = { ...this.session, ...result.sessionUpdates };
			if (result.sessionUpdates.currentUser === "visitor") setVisitor();
			if (result.sessionUpdates.connectedDeviceIp) this.updateFilesystem();
		}

		if (result.result.stdout)
			this.terminal?.writeln(this.normalizeLineEndings(result.result.stdout));
		if (result.result.stderr)
			this.terminal?.writeln(
				`\x1b[31m${this.normalizeLineEndings(result.result.stderr)}\x1b[0m`,
			);

		if (result.result.resumeRevealed) {
			this.dispatchEvent(
				new CustomEvent("resume-revealed", { bubbles: true, composed: true }),
			);
		}

		this.writePrompt();
	}

	private async processSudoWithPassword(password: string) {
		const SUDO_PASSWORD = "1116";
		if (password !== SUDO_PASSWORD) {
			this.terminal?.writeln(
				`\x1b[31m${msg("Sorry, try again.", { desc: "Error message" })}\x1b[0m`,
			);
			this.writePrompt();
			return;
		}

		this.session = { ...this.session, sudoAuthenticated: true };

		if (this.pendingSudoCommand) {
			const result = await executeCommand(this.pendingSudoCommand, {
				fs: this.fs,
				session: this.session,
			});

			if (result.sessionUpdates)
				this.session = { ...this.session, ...result.sessionUpdates };
			if (result.result.stdout)
				this.terminal?.writeln(
					this.normalizeLineEndings(result.result.stdout),
				);
			if (result.result.stderr)
				this.terminal?.writeln(
					`\x1b[31m${this.normalizeLineEndings(result.result.stderr)}\x1b[0m`,
				);
			if (result.result.resumeRevealed) {
				this.dispatchEvent(
					new CustomEvent("resume-revealed", {
						bubbles: true,
						composed: true,
					}),
				);
			}
		}

		this.pendingSudoCommand = "";
		this.writePrompt();
	}

	private async processSshWithPassword(password: string) {
		const SSH_PASSWORD = "1116";
		if (!this.pendingSshConnection) {
			this.writePrompt();
			return;
		}
		if (password !== SSH_PASSWORD) {
			const { user, ip } = this.pendingSshConnection;
			this.terminal?.writeln(
				`\x1b[31m${msg(str`${user}@${ip}: Permission denied, please try again.`, { desc: "SSH auth error" })}\x1b[0m`,
			);
			this.pendingSshConnection = null;
			this.writePrompt();
			return;
		}

		const { ip, user } = this.pendingSshConnection;
		this.session = {
			...this.session,
			connectedDeviceIp: ip,
			currentUser: user,
			cwd: "/",
			sudoAuthenticated: false,
		};
		this.updateFilesystem();
		this.pendingSshConnection = null;
		this.writePrompt();
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
