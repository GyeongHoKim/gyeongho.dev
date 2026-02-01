import { createSuccessResult } from "../../../../entities/session/model/session.ts";
import type {
	ExecuteCommandContext,
	ExecuteCommandResult,
} from "../command-interpreter.ts";

/**
 * Executes the id command to display user information.
 */
export function executeId(
	_args: string[],
	context: ExecuteCommandContext,
): ExecuteCommandResult {
	const { session } = context;
	const user = session.currentUser;

	let uid = 1000;
	let gid = 1000;
	let userName = user;
	let groupName = user;

	if (user === "gyeonghokim") {
		uid = 1000;
		gid = 1000;
		userName = "gyeonghokim";
		groupName = "gyeonghokim";
	} else if (user === "visitor") {
		uid = 1001;
		gid = 1001;
		userName = "visitor";
		groupName = "visitor";
	}

	const output = `uid=${uid}(${userName}) gid=${gid}(${groupName}) groups=${gid}(${groupName})`;

	return {
		result: createSuccessResult(output),
	};
}
