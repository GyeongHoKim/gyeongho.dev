/**
 * App router controller — route state, briefing/boot/login/desktop transitions,
 * auth subscription, boot timer. Used by AppRoot for render-only routing.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import { briefingStore } from "../../shared/lib/briefing-store.js";
import {
	subscribeAuth,
	type AuthState,
} from "../../shared/lib/auth-store.js";

export type Route = "boot" | "briefing" | "login" | "desktop";

export class AppRouterController implements ReactiveController {
	private _host: LitElement;
	private _route: Route = "boot";
	private _unsub?: () => void;
	private _bootTimeoutId?: ReturnType<typeof setTimeout>;

	constructor(host: LitElement) {
		this._host = host;
		host.addController(this);
	}

	get route(): Route {
		return this._route;
	}

	private _setRoute(route: Route): void {
		if (this._route === route) return;
		this._route = route;
		this._host.requestUpdate();
	}

	/** Call when user accepts mission briefing: mark seen, show boot, then login after delay. */
	acceptBriefing(): void {
		briefingStore.getState().setBriefingSeen(true);
		this._setRoute("boot");
		this._bootTimeoutId = setTimeout(() => {
			this._bootTimeoutId = undefined;
			if (this._route === "boot") this._setRoute("login");
		}, 1500);
	}

	hostConnected(): void {
		const briefingSeen = briefingStore.getState().briefingSeen;
		if (!briefingSeen) {
			this._setRoute("briefing");
			this._unsub = subscribeAuth((state: AuthState) => {
				if (state.user) this._setRoute("desktop");
				else if (this._route === "desktop") this._setRoute("login");
			});
			return;
		}
		// Returning users: always show boot then login
		this._setRoute("boot");
		setTimeout(() => {
			if (this._route === "boot") this._setRoute("login");
		}, 1500);
		this._unsub = subscribeAuth((state: AuthState) => {
			if (state.user) this._setRoute("desktop");
			else if (this._route === "desktop") this._setRoute("login");
		});
	}

	hostDisconnected(): void {
		if (this._bootTimeoutId !== undefined) {
			clearTimeout(this._bootTimeoutId);
		}
		this._unsub?.();
	}
}
