/**
 * Desktop state controller — menu open/close, resume overlay, editor file/cwd,
 * window-store subscription, open-file-in-editor handler, current time.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import {
	type AppId,
	openApp,
	subscribeWindowStore,
	bringToFront,
} from "../../../shared/lib/window-store.js";
import type { EditFileEvent } from "../../../features/terminal/lib/commands/edit.ts";

export class DesktopStateController implements ReactiveController {
	private _host: LitElement;
	private _menuOpen = false;
	private _resumeVisible = false;
	private _editorFile = "";
	private _editorCwd = "/";
	private _unsubscribe: (() => void) | null = null;
	private _boundOpenFileInEditor: (e: Event) => void;

	constructor(host: LitElement) {
		this._host = host;
		this._boundOpenFileInEditor = (e: Event) => this._onOpenFileInEditor(e);
		host.addController(this);
	}

	get menuOpen(): boolean {
		return this._menuOpen;
	}
	get resumeVisible(): boolean {
		return this._resumeVisible;
	}
	get editorFile(): string {
		return this._editorFile;
	}
	get editorCwd(): string {
		return this._editorCwd;
	}

	private _requestUpdate(): void {
		this._host.requestUpdate();
	}

	toggleMenu(): void {
		this._menuOpen = !this._menuOpen;
		this._requestUpdate();
	}

	closeMenu(): void {
		this._menuOpen = false;
		this._requestUpdate();
	}

	openTerminal(): void {
		openApp("terminal");
		this.closeMenu();
	}

	openBrowser(): void {
		openApp("browser");
		this.closeMenu();
	}

	setResumeRevealed(): void {
		this._resumeVisible = true;
		this._requestUpdate();
	}

	closeResume(): void {
		this._resumeVisible = false;
		this._requestUpdate();
	}

	/** Bring focused window (by data-app-id) to front. */
	handleWindowFocus(e: Event): void {
		const el = (e.target as HTMLElement).closest("[data-app-id]");
		const id = el?.getAttribute("data-app-id") as AppId | null;
		if (id && (["terminal", "text-editor", "browser"] as const).includes(id)) {
			bringToFront(id);
		}
	}

	getCurrentTime(): string {
		const now = new Date();
		return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	}

	private _onOpenFileInEditor(e: Event): void {
		const detail = (e as CustomEvent<EditFileEvent>).detail;
		this._editorFile = detail.path;
		this._editorCwd = detail.cwd;
		this._requestUpdate();
	}

	hostConnected(): void {
		this._unsubscribe = subscribeWindowStore(() => this._requestUpdate());
		window.addEventListener("open-file-in-editor", this._boundOpenFileInEditor);
	}

	hostDisconnected(): void {
		this._unsubscribe?.();
		window.removeEventListener(
			"open-file-in-editor",
			this._boundOpenFileInEditor,
		);
	}
}
