/**
 * edit command implementation
 *
 * Opens a file in the text editor app.
 * Creates the file if it doesn't exist.
 */

import { msg, str } from "@lit/localize";
import {
	createErrorResult,
	createSuccessResult,
} from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";
import { openApp } from "../../../../shared/lib/window-store.js";
import { resolvePath } from "../../../../entities/virtual-filesystem/lib/fs-helpers.ts";

/**
 * Event detail for edit command to open a file in the editor.
 */
export interface EditFileEvent {
	path: string;
	cwd: string;
}

/**
 * Executes the edit command - opens a file in the text editor.
 */
export function executeEdit(
	args: string[],
	context: ExecuteCommandContext,
): ExecuteCommandResult {
	if (args.length === 0) {
		return {
			result: createErrorResult(
				msg("Usage: edit <filename>", { desc: "edit usage" }),
			),
		};
	}

	const filename = args[0];
	const absolutePath = resolvePath(context.session.cwd, filename);

	// Open the text editor app
	openApp("text-editor");

	// Dispatch a custom event with the file info
	// The desktop-page will catch this and pass it to the text-editor-app
	window.dispatchEvent(
		new CustomEvent("open-file-in-editor", {
			detail: {
				path: absolutePath,
				cwd: context.session.cwd,
			} satisfies EditFileEvent,
		}),
	);

	return {
		result: createSuccessResult(
			msg(str`Opening ${filename} in editor...`, { desc: "edit success" }),
		),
	};
}
