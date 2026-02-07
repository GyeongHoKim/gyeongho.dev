/**
 * Window store — open windows and app visibility (Zustand vanilla).
 * Tracks which apps have windows open and whether each is minimized.
 */

import { createStore } from "zustand/vanilla";

export const APP_IDS = ["terminal", "text-editor", "browser"] as const;
export type AppId = (typeof APP_IDS)[number];

export interface WindowState {
	minimized: boolean;
}

export interface WindowPosition {
	x: number;
	y: number;
}

export type OpenWindows = Partial<Record<AppId, WindowState>>;

/** Order of windows (front to back). Last item is topmost. */
export type WindowZOrder = AppId[];

interface WindowStoreState {
	openWindows: OpenWindows;
	/** Stack order for z-index; last element is on top. */
	zOrder: WindowZOrder;
	positions: Partial<Record<AppId, WindowPosition>>;
}

interface WindowStoreActions {
	openApp: (id: AppId) => void;
	closeApp: (id: AppId) => void;
	setMinimized: (id: AppId, minimized: boolean) => void;
	restoreApp: (id: AppId) => void;
	/** Bring the given app's window to front (highest z-index). */
	bringToFront: (id: AppId) => void;
	setWindowPosition: (id: AppId, position: WindowPosition) => void;
}

type WindowStore = WindowStoreState & WindowStoreActions;

const BASE_Z = 10;

const windowStore = createStore<WindowStore>()((set) => ({
	openWindows: {},
	zOrder: [],
	positions: {},
	openApp: (id: AppId) => {
		set((state) => {
			const openWindows = { ...state.openWindows, [id]: { minimized: false } };
			const zOrder = state.zOrder.includes(id)
				? state.zOrder
				: [...state.zOrder, id];
			const positions = state.positions[id]
				? state.positions
				: { ...state.positions, [id]: { x: 0, y: 0 } };
			return { openWindows, zOrder, positions };
		});
	},
	closeApp: (id: AppId) => {
		set((state) => {
			const next = { ...state.openWindows };
			delete next[id];
			const zOrder = state.zOrder.filter((x) => x !== id);
			const positions = { ...state.positions };
			delete positions[id];
			return { openWindows: next, zOrder, positions };
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
				openWindows: {
					...state.openWindows,
					[id]: { ...entry, minimized: false },
				},
			};
		});
	},
	bringToFront: (id: AppId) => {
		set((state) => {
			if (!state.openWindows[id]) return state;
			const zOrder = [...state.zOrder.filter((x) => x !== id), id];
			return { zOrder };
		});
	},
	setWindowPosition: (id: AppId, position: WindowPosition) => {
		set((state) => {
			if (!state.openWindows[id]) return state;
			return { positions: { ...state.positions, [id]: position } };
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

export function bringToFront(id: AppId): void {
	windowStore.getState().bringToFront(id);
}

export function setWindowPosition(id: AppId, position: WindowPosition): void {
	windowStore.getState().setWindowPosition(id, position);
}

/** Z-index for the given app (higher = on top). */
export function getWindowZIndex(id: AppId): number {
	const zOrder = windowStore.getState().zOrder;
	const idx = zOrder.indexOf(id);
	return idx === -1 ? 0 : BASE_Z + idx;
}

export function getWindowPosition(id: AppId): WindowPosition {
	return windowStore.getState().positions[id] ?? { x: 0, y: 0 };
}

export function subscribeWindowStore(callback: () => void): () => void {
	return windowStore.subscribe(callback);
}
