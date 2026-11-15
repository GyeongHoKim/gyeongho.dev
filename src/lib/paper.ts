import type { CardTilt, CardTone } from "@ghds/web-components/card";

// 6 tones and 5 tilts are coprime: the pairing only repeats every 30 notes.
const TONES: readonly CardTone[] = [
	"warning",
	"primary",
	"success",
	"danger",
	"info",
	"neutral",
];
const TILTS: readonly CardTilt[] = ["right", "left", "right", "left", "none"];

/** Paper colour and lean of the index-th sticky note. */
export function paperFor(index: number): { tone: CardTone; tilt: CardTilt } {
	return {
		tone: TONES[index % TONES.length],
		tilt: TILTS[index % TILTS.length],
	};
}
