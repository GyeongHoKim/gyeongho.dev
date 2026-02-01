import { msg, str } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import {
	type VirtualNode,
	getNode,
	isVirtualDirectory,
	resolvePath,
} from "../../../../entities/virtual-filesystem/lib/fs-helpers.ts";

/**
 * Recursively searches for files matching a pattern.
 */
function searchDirectory(
	node: VirtualNode,
	pattern: string,
	results: string[],
): void {
	if (!isVirtualDirectory(node)) {
		return;
	}

	for (const child of node.children.values()) {
		const regex = new RegExp(
			`^${pattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
		);
		if (regex.test(child.name)) {
			results.push(child.path);
		}

		if (isVirtualDirectory(child)) {
			searchDirectory(child, pattern, results);
		}
	}
}

/**
 * Executes the find command to search for files.
 */
export function executeFind(
	args: string[],
	context: ExecuteCommandContext,
): ExecuteCommandResult {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg("Usage: find [path] -name <pattern>", {
					desc: "find usage error",
				}),
			),
		};
	}

	// Parse arguments
	let startPath = "/";
	let pattern = "";

	if (args.length >= 2 && args[args.length - 2] === "-name") {
		pattern = args[args.length - 1];
		if (args.length > 2) {
			startPath = args[0];
		}
	} else if (args.length === 1) {
		startPath = args[0];
		pattern = "*";
	} else {
		return {
			result: createErrorResult(
				msg("Usage: find [path] -name <pattern>", {
					desc: "find usage error",
				}),
			),
		};
	}

	// Resolve the start path
	const absolutePath = resolvePath(context.session.cwd, startPath);
	const startNode = getNode(context.fs, absolutePath);

	if (!startNode) {
		return {
			result: createErrorResult(
				msg(str`find: ${startPath}: No such file or directory`, {
					desc: "find error",
				}),
			),
		};
	}

	// Search for matching files
	const results: string[] = [];
	searchDirectory(startNode, pattern, results);

	if (results.length === 0) {
		return {
			result: createSuccessResult(""),
		};
	}

	return {
		result: createSuccessResult(results.join("\n")),
	};
}
