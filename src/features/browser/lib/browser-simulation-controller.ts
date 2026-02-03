/**
 * Browser simulation controller — URL, HTTP request/response, page data state.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import { getNetwork } from "../../network-simulation/lib/network.ts";
import { handleHttpRequest } from "../../network-simulation/lib/http-handler.ts";
import type { HttpRequest } from "../../network-simulation/model/types.ts";

export type LoginPageData =
	| { type: "login_form" }
	| { type: "user_list"; users: string[] }
	| { type: "error"; message: string }
	| { type: "user_profile"; user: string; hasResume: boolean };

const LOGIN_HOST = "192.168.1.20";
const LOGIN_PORT = 8080;

export class BrowserSimulationController implements ReactiveController {
	private _host: LitElement;
	private _pageData: LoginPageData = { type: "login_form" };

	constructor(host: LitElement) {
		this._host = host;
		host.addController(this);
	}

	get pageData(): LoginPageData {
		return this._pageData;
	}

	get loginUrl(): string {
		return `http://${LOGIN_HOST}:${LOGIN_PORT}/login`;
	}

	private _requestUpdate(): void {
		this._host.requestUpdate();
	}

	private _parseLoginResponse(response: {
		status: number;
		body: string;
	}): LoginPageData {
		try {
			const data = JSON.parse(response.body) as LoginPageData;
			if (
				data.type === "login_form" ||
				data.type === "user_list" ||
				data.type === "error"
			) {
				return data;
			}
		} catch {
			// ignore
		}
		return { type: "login_form" };
	}

	/** Load the login page (GET /login). Call from host firstUpdated. */
	loadLoginPage(): void {
		const network = getNetwork();
		const request: HttpRequest = {
			method: "GET",
			path: "/login",
			queryParams: {},
		};
		const response = handleHttpRequest(
			network,
			LOGIN_HOST,
			LOGIN_PORT,
			request,
		);
		this._pageData = this._parseLoginResponse(response);
		this._requestUpdate();
	}

	/** Submit login form (POST /login). */
	submitLogin(username: string, password: string): void {
		const body = new URLSearchParams({ username, password }).toString();
		const network = getNetwork();
		const request: HttpRequest = {
			method: "POST",
			path: "/login",
			queryParams: {},
			body,
		};
		const response = handleHttpRequest(
			network,
			LOGIN_HOST,
			LOGIN_PORT,
			request,
		);
		this._pageData = this._parseLoginResponse(response);
		this._requestUpdate();
	}

	/** User clicked in list: gyeonghokim reveals resume; others show profile. */
	onUserClick(user: string): void {
		if (user === "gyeonghokim") {
			this._host.dispatchEvent(
				new CustomEvent("resume-revealed", {
					bubbles: true,
					composed: true,
				}),
			);
		} else {
			this._pageData = { type: "user_profile", user, hasResume: false };
			this._requestUpdate();
		}
	}

	/** Navigate back to login form. */
	backToLogin(): void {
		this._pageData = { type: "login_form" };
		this._requestUpdate();
	}

	hostConnected(): void {}
	hostDisconnected(): void {}
}
