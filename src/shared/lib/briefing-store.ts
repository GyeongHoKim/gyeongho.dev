/**
 * Briefing store — whether the user has seen the mission briefing (Zustand vanilla).
 */

import { createStore } from "zustand/vanilla";

interface BriefingStoreState {
	briefingSeen: boolean;
}

interface BriefingStoreActions {
	setBriefingSeen: (seen: boolean) => void;
}

type BriefingStore = BriefingStoreState & BriefingStoreActions;

export const briefingStore = createStore<BriefingStore>()((set) => ({
	briefingSeen: false,
	setBriefingSeen: (seen: boolean) => set({ briefingSeen: seen }),
}));

export function getBriefingSeen(): boolean {
	return briefingStore.getState().briefingSeen;
}

export function setBriefingSeen(seen: boolean): void {
	briefingStore.getState().setBriefingSeen(seen);
}

export function subscribeBriefing(
	callback: (briefingSeen: boolean) => void,
): () => void {
	return briefingStore.subscribe((state) => {
		callback(state.briefingSeen);
	});
}
