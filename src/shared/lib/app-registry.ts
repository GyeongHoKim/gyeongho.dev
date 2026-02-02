/**
 * App registry — label and icon config per app for dock and elsewhere.
 */

import type { AppId } from "./window-store.js";

export interface AppConfig {
	label: string;
	icon: string;
}

export const APP_CONFIG: Record<AppId, AppConfig> = {
	terminal: { label: "Terminal", icon: "lucide:terminal" },
};

export function getAppConfig(id: AppId): AppConfig | undefined {
	return APP_CONFIG[id];
}
