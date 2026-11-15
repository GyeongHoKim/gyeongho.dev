import type { Locale } from "../i18n";

/** URL of the résumé PDF for a locale. */
export function resumePdfPath(locale: Locale): string {
	return `/resume/resume-${locale}.pdf`;
}
