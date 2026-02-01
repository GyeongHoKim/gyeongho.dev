/**
 * Auth state — current user and status (per data-model).
 * Client-only; no backend. Not the same as entities/session (terminal).
 */

import type { User } from "../../../entities/user/model/types.js";
import { getUserById } from "../../../entities/user/model/types.js";

export type AuthStatus = "idle" | "authenticating" | "error";

export interface AuthState {
	user: User | null;
	status: AuthStatus;
	errorMessage?: string;
}

const STORAGE_KEY = "gyeongho-dev-auth";

function getStoredUser(): User | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const { id } = JSON.parse(raw) as { id: string };
		return getUserById(id) ?? null;
	} catch {
		return null;
	}
}

let state: AuthState = {
	user: getStoredUser(),
	status: "idle",
};

const eventTarget = new EventTarget();

export function getAuthState(): AuthState {
	return { ...state };
}

export function getCurrentUser(): User | null {
	return state.user;
}

function setState(update: Partial<AuthState>): void {
	state = { ...state, ...update };
	eventTarget.dispatchEvent(new CustomEvent("auth-change", { detail: state }));
}

export function setVisitor(): void {
	const visitor = getUserById("visitor");
	if (!visitor) return;
	setState({ user: visitor, status: "idle", errorMessage: undefined });
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: visitor.id }));
	} catch {
		// ignore
	}
}

export function startGyeonghokimLogin(): void {
	setState({ status: "authenticating", errorMessage: undefined });
}

export function setGyeonghokimSuccess(): void {
	const user = getUserById("gyeonghokim");
	if (!user) return;
	setState({ user, status: "idle", errorMessage: undefined });
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id }));
	} catch {
		// ignore
	}
}

export function setGyeonghokimError(message: string): void {
	setState({ status: "error", errorMessage: message });
}

export function clearError(): void {
	setState({ status: "idle", errorMessage: undefined });
}

export function logout(): void {
	setState({ user: null, status: "idle", errorMessage: undefined });
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignore
	}
}

export function subscribeAuth(
	callback: (state: AuthState) => void,
): () => void {
	const handler = (e: Event) => callback((e as CustomEvent<AuthState>).detail);
	eventTarget.addEventListener("auth-change", handler);
	return () => eventTarget.removeEventListener("auth-change", handler);
}
