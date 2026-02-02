/**
 * Window store — open windows and app visibility (Zustand vanilla).
 * Tracks which apps have windows open and whether each is minimized.
 */

import { createStore } from "zustand/vanilla";

export const APP_IDS = ["terminal"] as const;
export type AppId = (typeof APP_IDS)[number];

export interface WindowState {
	minimized: boolean;
}

export type OpenWindows = Partial<Record<AppId, WindowState>>;

interface WindowStoreState {
	openWindows: OpenWindows;
}

interface WindowStoreActions {
	openApp: (id: AppId) => void;
	closeApp: (id: AppId) => void;
	setMinimized: (id: AppId, minimized: boolean) => void;
	restoreApp: (id: AppId) => void;
}

type WindowStore = WindowStoreState & WindowStoreActions;

const windowStore = createStore<WindowStore>()((set) => ({
	openWindows: {},
	openApp: (id: AppId) => {
		set((state) => ({
			openWindows: { ...state.openWindows, [id]: { minimized: false } },
		}));
	},
	closeApp: (id: AppId) => {
		set((state) => {
			const next = { ...state.openWindows };
			delete next[id];
			return { openWindows: next };
		});
	},
	setMinimized: (id: AppId, minimized: boolean) => {
		set((state) => {
			const entry = state.openWindows[id];
			if (!entry) return state;
			return {
				openWindows: { ...state.openWindows, [id]: { ...entry, minimized } },
			};
		});
	},
	restoreApp: (id: AppId) => {
		set((state) => {
			const entry = state.openWindows[id];
			if (!entry) return state;
			return {
				openWindows: { ...state.openWindows, [id]: { ...entry, minimized: false } },
			};
		});
	},
}));

export function getOpenWindows(): OpenWindows {
	return windowStore.getState().openWindows;
}

export function isAppVisible(id: AppId): boolean {
	const entry = windowStore.getState().openWindows[id];
	return Boolean(entry && !entry.minimized);
}

export function openApp(id: AppId): void {
	windowStore.getState().openApp(id);
}

export function closeApp(id: AppId): void {
	windowStore.getState().closeApp(id);
}

export function setMinimized(id: AppId, minimized: boolean): void {
	windowStore.getState().setMinimized(id, minimized);
}

export function restoreApp(id: AppId): void {
	windowStore.getState().restoreApp(id);
}

export function subscribeWindowStore(callback: () => void): () => void {
	return windowStore.subscribe(callback);
}
