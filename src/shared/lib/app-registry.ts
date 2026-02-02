/**
 * App registry — label and icon config per app for dock and elsewhere.
 * icon = iconify name; iconSvg = app-provided SVG URL. Use iconSvg if set, else icon.
 */

import type { AppId } from "./window-store.js";

export interface AppConfig {
	label: string;
	/** Iconify icon name (e.g. "lucide:terminal"). Used when iconSvg is not set. */
	icon?: string;
	/** App-provided SVG URL (path or data URL). Takes precedence over icon. */
	iconSvg?: string;
}

export const APP_CONFIG: Record<AppId, AppConfig> = {
	terminal: { label: "Terminal", icon: "lucide:terminal" },
};

/** App IDs shown on desktop as icons, in grid order (top-left first). */
export const DESKTOP_APP_IDS: readonly AppId[] = ["terminal"];

export function getAppConfig(id: AppId): AppConfig | undefined {
	return APP_CONFIG[id];
}

export function getDesktopAppIds(): AppId[] {
	return [...DESKTOP_APP_IDS];
}
