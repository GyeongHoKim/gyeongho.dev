import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "../i18n";
import { resumePdfPath } from "./resume-path";

export { resumePdfPath };

/** True when the locale's PDF exists under publicDir. */
export function resumeAvailable(locale: Locale, publicDir: string): boolean {
	return existsSync(join(publicDir, resumePdfPath(locale)));
}
