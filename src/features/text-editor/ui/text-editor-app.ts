/**
 * Text Editor App
 *
 * Simple text editor for creating and editing files in the virtual filesystem.
 * File open/save and status are in TextEditorController.
 */

import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { msg, updateWhenLocaleChanges } from "@lit/localize";
import "../../../widgets/floating-window/ui/floating-window.ts";
import {
	setMinimized,
	closeApp,
	setWindowPosition,
} from "../../../shared/lib/window-store.js";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import { TextEditorController } from "../lib/text-editor-controller.ts";

@customElement("text-editor-app")
export class TextEditorApp extends LitElement {
	private readonly _editor = new TextEditorController(this);

	constructor() {
		super();
		updateWhenLocaleChanges(this);
	}

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

	/** The virtual filesystem to read/write files */
	@property({ attribute: false })
	filesystem: VirtualFilesystem | null = null;

	/** Current working directory for relative paths */
	@property({ type: String })
	cwd = "/";

	/** Initial file to open (if any) */
	@property({ type: String })
	initialFile = "";

	override connectedCallback(): void {
		super.connectedCallback();
		this._editor.setOptions({
			filesystem: this.filesystem,
			cwd: this.cwd,
			initialFile: this.initialFile,
		});
	}

	override updated(changedProperties: Map<string, unknown>): void {
		if (
			changedProperties.has("initialFile") ||
			changedProperties.has("filesystem") ||
			changedProperties.has("cwd")
		) {
			this._editor.setOptions({
				filesystem: this.filesystem,
				cwd: this.cwd,
				initialFile: this.initialFile,
			});
		}
	}

	private _onContentChange(e: Event): void {
		this._editor.setContent((e.target as HTMLTextAreaElement).value);
	}

	private _onKeyDown(e: KeyboardEvent): void {
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			this._editor.save();
			return;
		}
		if (e.key === "Tab") {
			e.preventDefault();
			const textarea = e.target as HTMLTextAreaElement;
			const start = textarea.selectionStart;
			const end = textarea.selectionEnd;
			const newValue = `${this._editor.content.substring(0, start)}\t${this._editor.content.substring(end)}`;
			this._editor.setContent(newValue);
			this.updateComplete.then(() => {
				textarea.selectionStart = textarea.selectionEnd = start + 1;
			});
		}
	}

	override render() {
		const ed = this._editor;
		return html`
			<floating-window
				title=${msg("Text Editor", { desc: "Window title" })}
				@window-minimize=${() => setMinimized("text-editor", true)}
				@window-close=${() => closeApp("text-editor")}
				@window-drag=${(
					e: CustomEvent<{ x: number; y: number }>,
				) => setWindowPosition("text-editor", e.detail)}
			>
				<div slot="content" class="editor-content">
					<div class="editor-area">
						<textarea
							.value=${ed.content}
							@input=${this._onContentChange}
							@keydown=${this._onKeyDown}
							placeholder=${msg("Start typing...", {
								desc: "Editor placeholder",
							})}
							spellcheck="false"
						></textarea>
					</div>
					<div class="status-bar">
						<span class="status-message ${ed.statusIsError ? "error" : ""}">
							${ed.statusMessage}
						</span>
						<span>
							${
								ed.content !== ed.originalContent
									? msg("Modified", { desc: "Status: file modified" })
									: msg("Ctrl+S to save", { desc: "Save shortcut hint" })
							}
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
