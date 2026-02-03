/**
 * Text Editor App
 *
 * Simple text editor for creating and editing files in the virtual filesystem.
 * Used for writing scripts (like webshells) in the hacking simulation.
 */

import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "../../../widgets/floating-window/ui/floating-window.ts";
import {
	setMinimized,
	closeApp,
} from "../../../shared/lib/window-store.js";
import {
	readFile,
	writeFile,
	resolvePath,
} from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";

@customElement("text-editor-app")
export class TextEditorApp extends LitElement {
	static styles = css`
		:host {
			display: block;
		}

		.editor-content {
			flex: 1;
			padding: 0;
			background: #1e1e1e;
			overflow: hidden;
			display: flex;
			flex-direction: column;
			height: 100%;
		}

		.editor-area {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-height: 0;
		}

		textarea {
			flex: 1;
			width: 100%;
			background: #1e1e1e;
			color: #d4d4d4;
			border: none;
			padding: 12px;
			font-family: "Cascadia Code", "Fira Code", monospace;
			font-size: 14px;
			line-height: 1.5;
			resize: none;
			outline: none;
			tab-size: 4;
		}

		textarea::placeholder {
			color: #555;
		}

		.status-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 4px 12px;
			background: #2d2d2d;
			border-top: 1px solid #404040;
			font-size: 12px;
			color: #888;
		}

		.status-message {
			color: #4ec9b0;
		}

		.status-message.error {
			color: #f44747;
		}
	`;

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

	/** The virtual filesystem to read/write files */
	@property({ attribute: false })
	filesystem: VirtualFilesystem | null = null;

	/** Current working directory for relative paths */
	@property({ type: String })
	cwd = "/";

	/** Initial file to open (if any) */
	@property({ type: String })
	initialFile = "";

	@state()
	private content = "";

	@state()
	private currentFile = "";

	@state()
	private isModified = false;

	@state()
	private statusMessage = "";

	@state()
	private statusIsError = false;

	private originalContent = "";

	override connectedCallback() {
		super.connectedCallback();
		if (this.initialFile && this.filesystem) {
			this.openFile(this.initialFile);
		}
	}

	override updated(changedProperties: Map<string, unknown>) {
		if (
			changedProperties.has("initialFile") &&
			this.initialFile &&
			this.filesystem
		) {
			this.openFile(this.initialFile);
		}
	}

	private openFile(filename: string) {
		if (!this.filesystem) {
			this.setStatus("No filesystem available", true);
			return;
		}

		const absolutePath = resolvePath(this.cwd, filename);
		const result = readFile(this.filesystem, absolutePath);

		if ("error" in result) {
			// File doesn't exist - create new
			this.currentFile = absolutePath;
			this.content = "";
			this.originalContent = "";
			this.isModified = false;
			this.setStatus(`New file: ${filename}`);
		} else {
			this.currentFile = absolutePath;
			this.content = result.content;
			this.originalContent = result.content;
			this.isModified = false;
			this.setStatus(`Opened: ${filename}`);
		}

		this.requestUpdate();
	}

	private handleContentChange(e: Event) {
		const textarea = e.target as HTMLTextAreaElement;
		this.content = textarea.value;
		this.isModified = this.content !== this.originalContent;
	}

	private handleKeyDown(e: KeyboardEvent) {
		// Handle Ctrl+S to save
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			this.saveFile();
		}

		// Handle Tab key for indentation
		if (e.key === "Tab") {
			e.preventDefault();
			const textarea = e.target as HTMLTextAreaElement;
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;

			// Insert tab character
			const newValue = `${this.content.substring(0, start)}\t${this.content.substring(end)}`;
			this.content = newValue;
			this.isModified = this.content !== this.originalContent;

			// Move cursor after tab
			this.updateComplete.then(() => {
				textarea.selectionStart = textarea.selectionEnd = start + 1;
			});
		}
	}

	private saveFile() {
		if (!this.filesystem) {
			this.setStatus("No filesystem available", true);
			return;
		}

		if (!this.currentFile) {
			this.setStatus("No file to save", true);
			return;
		}

		const result = writeFile(this.filesystem, this.currentFile, this.content);

		if ("error" in result) {
			this.setStatus(`Error: ${result.error}`, true);
		} else {
			this.originalContent = this.content;
			this.isModified = false;
			this.setStatus(`Saved: ${this.currentFile.split("/").pop()}`);

			// Dispatch event to notify parent
			this.dispatchEvent(
				new CustomEvent("file-saved", {
					detail: { path: this.currentFile, content: this.content },
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	private setStatus(message: string, isError = false) {
		this.statusMessage = message;
		this.statusIsError = isError;

		// Clear status after 3 seconds
		setTimeout(() => {
			if (this.statusMessage === message) {
				this.statusMessage = "";
			}
		}, 3000);
	}

	private handleClose() {
		closeApp("text-editor");
	}

	private handleMinimize() {
		setMinimized("text-editor", true);
	}

	override render() {
		return html`
			<floating-window
				title=${msg("Text Editor", { desc: "Window title" })}
				@window-minimize=${this.handleMinimize}
				@window-close=${this.handleClose}
			>
				<div slot="content" class="editor-content">
					<div class="editor-area">
						<textarea
							.value=${this.content}
							@input=${this.handleContentChange}
							@keydown=${this.handleKeyDown}
							placeholder=${msg("Start typing...", {
								desc: "Editor placeholder",
							})}
							spellcheck="false"
						></textarea>
					</div>
					<div class="status-bar">
						<span class="status-message ${this.statusIsError ? "error" : ""}">
							${this.statusMessage}
						</span>
						<span>
							${msg("Ctrl+S to save", { desc: "Save shortcut hint" })}
						</span>
					</div>
				</div>
			</floating-window>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"text-editor-app": TextEditorApp;
	}
}
