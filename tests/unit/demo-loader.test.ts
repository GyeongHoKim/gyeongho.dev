import { expect, test } from "vitest";
import { demoName, findImporter } from "../../src/scripts/demo-loader";

test("demo tags map to a module name", () => {
	expect(demoName("DEMO-FISHEYE-INVERSE")).toBe("fisheye-inverse");
	expect(demoName("demo-nat")).toBe("nat");
	expect(demoName("gh-alert")).toBeNull();
	expect(demoName("demo-")).toBeNull();
});
test("the importer is found by its folder name", () => {
	const load = async () => ({});
	const importers = { "../../../demos/fisheye-inverse/index.ts": load };
	expect(findImporter(importers, "fisheye-inverse")).toBe(load);
	expect(findImporter(importers, "inverse")).toBeUndefined();
});
