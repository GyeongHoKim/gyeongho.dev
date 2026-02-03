/**
 * Text editor controller — open/save file, content, status message.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import {
	readFile,
	writeFile,
	resolvePath,
} from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import type { VirtualFilesystem } from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";

export interface TextEditorControllerOptions {
	filesystem: VirtualFilesystem | null;
	cwd: string;
	initialFile: string;
}

export class TextEditorController implements ReactiveController {
	private _host: LitElement;
	private _filesystem: VirtualFilesystem | null = null;
	private _content = "";
	private _currentFile = "";
	private _statusMessage = "";
	private _statusIsError = false;
	private _originalContent = "";
	private _statusTimeoutId: ReturnType<typeof setTimeout> | null = null;

	constructor(host: LitElement) {
		this._host = host;
		host.addController(this);
	}

	get content(): string {
		return this._content;
	}
	get currentFile(): string {
		return this._currentFile;
	}
	get statusMessage(): string {
		return this._statusMessage;
	}
	get statusIsError(): boolean {
		return this._statusIsError;
	}
	get originalContent(): string {
		return this._originalContent;
	}

	private _requestUpdate(): void {
		this._host.requestUpdate();
	}

	private _setStatus(message: string, isError = false): void {
		this._statusMessage = message;
		this._statusIsError = isError;
		if (this._statusTimeoutId !== null) {
			clearTimeout(this._statusTimeoutId);
		}
		this._statusTimeoutId = setTimeout(() => {
			if (this._statusMessage === message) {
				this._statusMessage = "";
				this._requestUpdate();
			}
			this._statusTimeoutId = null;
		}, 3000);
		this._requestUpdate();
	}

	/**
	 * Update options and optionally open initial file. Call when host props change.
	 */
	setOptions(options: TextEditorControllerOptions): void {
		this._filesystem = options.filesystem;
		if (options.initialFile && options.filesystem) {
			this.openFile(resolvePath(options.cwd, options.initialFile));
		}
	}

	openFile(absolutePath: string): void {
		if (!this._filesystem) {
			this._setStatus("No filesystem available", true);
			return;
		}

		const result = readFile(this._filesystem, absolutePath);
		const filename = absolutePath.split("/").pop() ?? absolutePath;

		if ("error" in result) {
			this._currentFile = absolutePath;
			this._content = "";
			this._originalContent = "";
			this._setStatus(`New file: ${filename}`);
		} else {
			this._currentFile = absolutePath;
			this._content = result.content;
			this._originalContent = result.content;
			this._setStatus(`Opened: ${filename}`);
		}
		this._requestUpdate();
	}

	setContent(value: string): void {
		this._content = value;
		this._requestUpdate();
	}

	save(): void {
		if (!this._filesystem) {
			this._setStatus("No filesystem available", true);
			return;
		}
		if (!this._currentFile) {
			this._setStatus("No file to save", true);
			return;
		}

		const result = writeFile(
			this._filesystem,
			this._currentFile,
			this._content,
		);

		if ("error" in result) {
			this._setStatus(`Error: ${result.error}`, true);
		} else {
			this._originalContent = this._content;
			this._setStatus(`Saved: ${this._currentFile.split("/").pop()}`);
			this._host.dispatchEvent(
				new CustomEvent("file-saved", {
					detail: { path: this._currentFile, content: this._content },
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	hostDisconnected(): void {
		if (this._statusTimeoutId !== null) {
			clearTimeout(this._statusTimeoutId);
		}
	}
}
