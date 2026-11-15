import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { resumeAvailable, resumePdfPath } from "../../src/lib/resume";

it("maps locales to files", () => {
	expect(resumePdfPath("ko")).toBe("/resume/resume-ko.pdf");
	expect(resumePdfPath("en")).toBe("/resume/resume-en.pdf");
});
it("reports a missing file", () => {
	expect(resumeAvailable("ko", "/nonexistent")).toBe(false);
});
it("reports an existing file only for its locale", () => {
	const dir = mkdtempSync(join(tmpdir(), "resume-"));
	mkdirSync(join(dir, "resume"));
	writeFileSync(join(dir, "resume", "resume-ko.pdf"), "%PDF-");
	expect(resumeAvailable("ko", dir)).toBe(true);
	expect(resumeAvailable("en", dir)).toBe(false);
});
