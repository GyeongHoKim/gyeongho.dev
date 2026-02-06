/**
 * Device store — detects mobile vs desktop and exposes reactive state (Zustand vanilla).
 * Uses screen width + user agent heuristic. Listens for resize to handle orientation changes.
 */

import { createStore } from "zustand/vanilla";

const MOBILE_BREAKPOINT = 768;

interface DeviceStoreState {
	isMobile: boolean;
}

interface DeviceStoreActions {
	update: () => void;
}

type DeviceStore = DeviceStoreState & DeviceStoreActions;

function detectMobile(): boolean {
	if (typeof window === "undefined") return false;
	const narrowScreen = window.innerWidth <= MOBILE_BREAKPOINT;
	const mobileAgent =
		/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);
	return narrowScreen || mobileAgent;
}

const deviceStore = createStore<DeviceStore>()((set) => ({
	isMobile: detectMobile(),
	update: () => set({ isMobile: detectMobile() }),
}));

// Listen for resize to handle orientation changes
if (typeof window !== "undefined") {
	window.addEventListener("resize", () => deviceStore.getState().update());
}

export function isMobile(): boolean {
	return deviceStore.getState().isMobile;
}

export function subscribeDevice(
	callback: (isMobile: boolean) => void,
): () => void {
	return deviceStore.subscribe((state) => callback(state.isMobile));
}
