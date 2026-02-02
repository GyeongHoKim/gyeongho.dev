/**
 * Auth store — current user and status (Zustand vanilla).
 * Client-only; no backend. Uses User entity from entities/user.
 */

import { createStore } from "zustand/vanilla";
import type { User } from "../../entities/user/model/types.js";
import { getUserById } from "../../entities/user/model/types.js";

export type AuthStatus = "idle" | "authenticating" | "error";

export interface AuthState {
	user: User | null;
	status: AuthStatus;
	errorMessage?: string;
}

interface AuthStoreState {
	userId: string | null;
	status: AuthStatus;
	errorMessage?: string;
}

interface AuthStoreActions {
	setVisitor: () => void;
	startGyeonghokimLogin: () => void;
	setGyeonghokimSuccess: () => void;
	setGyeonghokimError: (message: string) => void;
	clearError: () => void;
	logout: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const authStore = createStore<AuthStore>()((set) => ({
	userId: null,
	status: "idle",
	errorMessage: undefined,
	setVisitor: () => {
		const visitor = getUserById("visitor");
		if (!visitor) return;
		set({ userId: visitor.id, status: "idle", errorMessage: undefined });
	},
	startGyeonghokimLogin: () => {
		set({ status: "authenticating", errorMessage: undefined });
	},
	setGyeonghokimSuccess: () => {
		const user = getUserById("gyeonghokim");
		if (!user) return;
		set({ userId: user.id, status: "idle", errorMessage: undefined });
	},
	setGyeonghokimError: (message: string) => {
		set({ status: "error", errorMessage: message });
	},
	clearError: () => {
		set({ status: "idle", errorMessage: undefined });
	},
	logout: () => {
		set({ userId: null, status: "idle", errorMessage: undefined });
	},
}));

function getAuthStateFromStore(): AuthState {
	const { userId, status, errorMessage } = authStore.getState();
	const user = userId ? getUserById(userId) ?? null : null;
	return { user, status, errorMessage };
}

export function getAuthState(): AuthState {
	return getAuthStateFromStore();
}

export function getCurrentUser(): User | null {
	const { userId } = authStore.getState();
	return userId ? getUserById(userId) ?? null : null;
}

export function setVisitor(): void {
	authStore.getState().setVisitor();
}

export function startGyeonghokimLogin(): void {
	authStore.getState().startGyeonghokimLogin();
}

export function setGyeonghokimSuccess(): void {
	authStore.getState().setGyeonghokimSuccess();
}

export function setGyeonghokimError(message: string): void {
	authStore.getState().setGyeonghokimError(message);
}

export function clearError(): void {
	authStore.getState().clearError();
}

export function logout(): void {
	authStore.getState().logout();
}

export function subscribeAuth(callback: (state: AuthState) => void): () => void {
	return authStore.subscribe(() => {
		callback(getAuthStateFromStore());
	});
}
