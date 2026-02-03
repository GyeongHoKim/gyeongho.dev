/**
 * Auth form controller — auth state subscription, password user/value,
 * user select (visitor / gyeonghokim), password submit/cancel/validate.
 */

import type { ReactiveController } from "lit";
import type { LitElement } from "lit";
import {
	setVisitor,
	startGyeonghokimLogin,
	setGyeonghokimSuccess,
	setGyeonghokimError,
	clearError,
	getAuthState,
	subscribeAuth,
	type AuthState,
} from "../../../shared/lib/auth-store.js";
import { validateGyeonghokimPassword } from "./validate-password.js";
import type { User } from "../../../entities/user/model/types.js";

export interface AuthFormControllerOptions {
	/** Returns the localized "wrong password" error message. */
	getWrongPasswordMessage: () => string;
}

export class AuthFormController implements ReactiveController {
	private _host: LitElement;
	private _authState: AuthState = getAuthState();
	private _password = "";
	private _passwordUser: User | null = null;
	private _unsub?: () => void;
	private _getWrongPasswordMessage: () => string;

	constructor(
		host: LitElement,
		options: AuthFormControllerOptions,
	) {
		this._host = host;
		this._getWrongPasswordMessage = options.getWrongPasswordMessage;
		host.addController(this);
	}

	get authState(): AuthState {
		return this._authState;
	}
	get password(): string {
		return this._password;
	}
	get passwordUser(): User | null {
		return this._passwordUser;
	}
	get showPassword(): boolean {
		return this._passwordUser !== null;
	}

	private _requestUpdate(): void {
		this._host.requestUpdate();
	}

	onUserSelect(user: User): void {
		if (user.role === "visitor") {
			setVisitor();
			return;
		}
		if (user.role === "authenticated") {
			clearError();
			this._passwordUser = user;
			this._password = "";
			startGyeonghokimLogin();
			this._requestUpdate();
		}
	}

	setPassword(value: string): void {
		this._password = value;
		clearError();
		this._requestUpdate();
	}

	submit(): void {
		if (validateGyeonghokimPassword(this._password)) {
			setGyeonghokimSuccess();
			this._passwordUser = null;
			this._password = "";
			this._requestUpdate();
		} else {
			setGyeonghokimError(this._getWrongPasswordMessage());
		}
	}

	cancel(): void {
		this._passwordUser = null;
		this._password = "";
		clearError();
		this._requestUpdate();
	}

	hostConnected(): void {
		this._unsub = subscribeAuth((s) => {
			this._authState = s;
			this._requestUpdate();
		});
	}

	hostDisconnected(): void {
		this._unsub?.();
	}
}
