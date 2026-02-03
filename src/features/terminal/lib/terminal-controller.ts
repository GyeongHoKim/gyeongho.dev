/**
 * Terminal controller — xterm instance, session, fs, input handling,
 * command execution, sudo/ssh password flow, prompt writing.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import { msg, str } from "@lit/localize";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { setVisitor } from "../../../shared/lib/auth-store.js";
import { createSession } from "../../../entities/session/model/session.ts";
import type { Session } from "../../../entities/session/model/session.ts";
import { createDefaultFilesystem } from "../../../entities/virtual-filesystem/lib/create-default-fs.ts";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import { executeCommand } from "./command-interpreter.ts";
import {
	getNetwork,
	initializeNetwork,
} from "../../network-simulation/lib/network.ts";
import { getDeviceByIp } from "../../network-simulation/model/types.ts";

export class TerminalController implements ReactiveController {
	private _host: LitElement;
	private _session: Session = createSession();
	private _terminal: Terminal | null = null;
	private _fitAddon: FitAddon | null = null;
	private _fs: VirtualFilesystem = createDefaultFilesystem();
	private _currentLine = "";
	private _isWaitingForPassword = false;
	private _isWaitingForSshPassword = false;
	private _pendingSudoCommand = "";
	private _pendingSshConnection: {
		ip: string;
		user: "visitor" | "gyeonghokim";
	} | null = null;

	constructor(host: LitElement) {
		this._host = host;
		host.addController(this);
	}

	private _getConnectedFilesystem(): VirtualFilesystem {
		const network = getNetwork();
		const device = getDeviceByIp(network, this._session.connectedDeviceIp);
		if (!device) return createDefaultFilesystem();
		return device.fs;
	}

	private _updateFilesystem(): void {
		this._fs = this._getConnectedFilesystem();
	}

	/**
	 * Initializes the terminal with the given container element.
	 * Call from the host's firstUpdated after the container is in the DOM.
	 */
	init(container: HTMLElement): void {
		initializeNetwork();

		const baseSession = createSession();
		this._session = { ...baseSession, currentUser: "visitor" };
		this._updateFilesystem();
		this._currentLine = "";

		this._terminal = new Terminal({
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

		this._fitAddon = new FitAddon();
		this._terminal.loadAddon(this._fitAddon);
		this._terminal.open(container);

		setTimeout(() => this._fitAddon?.fit(), 0);

		this._terminal.writeln(
			msg("Welcome to gyeongho.dev terminal", { desc: "Terminal welcome" }),
		);
		this._terminal.writeln(
			msg('Type "help" for available commands.', { desc: "Terminal hint" }),
		);
		this._terminal.writeln("");
		this._writePrompt();

		this._terminal.onData((data) => this._handleInput(data));

		new ResizeObserver(() => this._fitAddon?.fit()).observe(container);
	}

	private _writePrompt(): void {
		const network = getNetwork();
		const device = getDeviceByIp(network, this._session.connectedDeviceIp);
		const hostname = device?.hostname || "unknown";
		const prompt = `${this._session.currentUser}@${hostname}:${this._session.cwd}$ `;
		this._terminal?.write(prompt);
	}

	private _normalizeLineEndings(text: string): string {
		return text.replace(/\r?\n/g, "\r\n");
	}

	private _dispatchResumeRevealed(): void {
		this._host.dispatchEvent(
			new CustomEvent("resume-revealed", { bubbles: true, composed: true }),
		);
	}

	private async _handleInput(data: string): Promise<void> {
		if (!this._terminal) return;

		if (this._isWaitingForSshPassword) {
			if (data === "\r") {
				this._terminal.writeln("");
				const password = this._currentLine;
				this._currentLine = "";
				this._isWaitingForSshPassword = false;
				await this._processSshWithPassword(password);
				return;
			}
			if (data === "\x7f") {
				if (this._currentLine.length > 0)
					this._currentLine = this._currentLine.slice(0, -1);
				return;
			}
			if (data === "\x03") {
				this._terminal.writeln("^C");
				this._currentLine = "";
				this._isWaitingForSshPassword = false;
				this._pendingSshConnection = null;
				this._writePrompt();
				return;
			}
			this._currentLine += data;
			return;
		}

		if (this._isWaitingForPassword) {
			if (data === "\r") {
				this._terminal.writeln("");
				await this._processSudoWithPassword(this._currentLine);
				this._currentLine = "";
				this._isWaitingForPassword = false;
				return;
			}
			if (data === "\x7f") {
				if (this._currentLine.length > 0)
					this._currentLine = this._currentLine.slice(0, -1);
				return;
			}
			if (data === "\x03") {
				this._terminal.writeln("^C");
				this._currentLine = "";
				this._isWaitingForPassword = false;
				this._pendingSudoCommand = "";
				this._writePrompt();
				return;
			}
			this._currentLine += data;
			return;
		}

		if (data === "\r") {
			this._terminal.writeln("");
			await this._processCommand(this._currentLine);
			this._currentLine = "";
		} else if (data === "\x7f") {
			if (this._currentLine.length > 0) {
				this._currentLine = this._currentLine.slice(0, -1);
				this._terminal.write("\b \b");
			}
		} else if (data === "\x03") {
			this._terminal.writeln("^C");
			this._currentLine = "";
			this._writePrompt();
		} else if (data >= " ") {
			this._currentLine += data;
			this._terminal.write(data);
		}
	}

	private async _processCommand(line: string): Promise<void> {
		const trimmed = line.trim();
		if (!trimmed) {
			this._writePrompt();
			return;
		}

		if (trimmed.startsWith("sudo ") && !this._session.sudoAuthenticated) {
			this._pendingSudoCommand = trimmed.slice(5).trim();
			this._terminal?.write(
				msg(str`[sudo] password for ${this._session.currentUser}: `, {
					desc: "Terminal sudo prompt",
				}),
			);
			this._isWaitingForPassword = true;
			return;
		}

		const result = await executeCommand(trimmed, {
			fs: this._fs,
			session: this._session,
		});

		if (result.needsSshPassword) {
			this._pendingSshConnection = result.needsSshPassword;
			this._terminal?.write(msg("password: ", { desc: "SSH password prompt" }));
			this._isWaitingForSshPassword = true;
			return;
		}

		if (result.sessionUpdates) {
			this._session = { ...this._session, ...result.sessionUpdates };
			if (result.sessionUpdates.currentUser === "visitor") setVisitor();
			if (result.sessionUpdates.connectedDeviceIp) this._updateFilesystem();
		}

		if (result.result.stdout)
			this._terminal?.writeln(this._normalizeLineEndings(result.result.stdout));
		if (result.result.stderr)
			this._terminal?.writeln(
				`\x1b[31m${this._normalizeLineEndings(result.result.stderr)}\x1b[0m`,
			);

		if (result.result.resumeRevealed) {
			this._dispatchResumeRevealed();
		}

		this._writePrompt();
	}

	private async _processSudoWithPassword(password: string): Promise<void> {
		const SUDO_PASSWORD = "1116";
		if (password !== SUDO_PASSWORD) {
			this._terminal?.writeln(
				`\x1b[31m${msg("Sorry, try again.", { desc: "Error message" })}\x1b[0m`,
			);
			this._writePrompt();
			return;
		}

		this._session = { ...this._session, sudoAuthenticated: true };

		if (this._pendingSudoCommand) {
			const result = await executeCommand(this._pendingSudoCommand, {
				fs: this._fs,
				session: this._session,
			});

			if (result.sessionUpdates)
				this._session = { ...this._session, ...result.sessionUpdates };
			if (result.result.stdout)
				this._terminal?.writeln(
					this._normalizeLineEndings(result.result.stdout),
				);
			if (result.result.stderr)
				this._terminal?.writeln(
					`\x1b[31m${this._normalizeLineEndings(result.result.stderr)}\x1b[0m`,
				);
			if (result.result.resumeRevealed) {
				this._dispatchResumeRevealed();
			}
		}

		this._pendingSudoCommand = "";
		this._writePrompt();
	}

	private async _processSshWithPassword(password: string): Promise<void> {
		const SSH_PASSWORD = "1116";
		if (!this._pendingSshConnection) {
			this._writePrompt();
			return;
		}
		if (password !== SSH_PASSWORD) {
			const { user, ip } = this._pendingSshConnection;
			this._terminal?.writeln(
				`\x1b[31m${msg(str`${user}@${ip}: Permission denied, please try again.`, { desc: "SSH auth error" })}\x1b[0m`,
			);
			this._pendingSshConnection = null;
			this._writePrompt();
			return;
		}

		const { ip, user } = this._pendingSshConnection;
		this._session = {
			...this._session,
			connectedDeviceIp: ip,
			currentUser: user,
			cwd: "/",
			sudoAuthenticated: false,
		};
		this._updateFilesystem();
		this._pendingSshConnection = null;
		this._writePrompt();
	}

	hostDisconnected(): void {
		this._terminal?.dispose();
		this._terminal = null;
		this._fitAddon = null;
	}
}
