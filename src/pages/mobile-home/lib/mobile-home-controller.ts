/**
 * Mobile Home Controller — manages which app is currently open
 * and the resume overlay state for the mobile experience.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";

export type MobileApp = "terminus" | null;

export class MobileHomeController implements ReactiveController {
	private _host: LitElement;
	private _activeApp: MobileApp = null;
	private _resumeVisible = false;

	constructor(host: LitElement) {
		this._host = host;
		host.addController(this);
	}

	get activeApp(): MobileApp {
		return this._activeApp;
	}

	get resumeVisible(): boolean {
		return this._resumeVisible;
	}

	openApp(app: MobileApp): void {
		this._activeApp = app;
		this._host.requestUpdate();
	}

	closeApp(): void {
		this._activeApp = null;
		this._host.requestUpdate();
	}

	setResumeRevealed(): void {
		this._resumeVisible = true;
		this._host.requestUpdate();
	}

	closeResume(): void {
		this._resumeVisible = false;
		this._host.requestUpdate();
	}

	hostConnected(): void {}
	hostDisconnected(): void {}
}
