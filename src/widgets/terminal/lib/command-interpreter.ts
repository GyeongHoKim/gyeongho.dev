/**
 * Shell Command Interpreter
 *
 * Parses and executes shell commands against the virtual filesystem.
 * Implements Linux-like commands: ls, cd, pwd, cat, clear, sudo, ./resume
 */

import { msg, str } from "@lit/localize";
import {
	type Session,
	createErrorResult,
	createSuccessResult,
} from "../../../entities/session/model/session.ts";
import {
	type VirtualFilesystem,
	getDirectory,
	getFile,
	getNode,
	isExecutable,
	listChildren,
	readFile,
	resolvePath,
} from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import type { CommandResult } from "../../../entities/session/model/session.ts";

/** The correct sudo password */
const SUDO_PASSWORD = "1116";

/**
 * Parses a command line into command name and arguments.
 */
function parseCommandLine(line: string): { command: string; args: string[] } {
	const trimmed = line.trim();
	if (!trimmed) {
		return { command: "", args: [] };
	}

	const parts = trimmed.split(/\s+/);
	return {
		command: parts[0],
		args: parts.slice(1),
	};
}

/**
 * Executes the `ls` command.
 */
function executeLs(
	fs: VirtualFilesystem,
	session: Session,
	args: string[],
): CommandResult {
	const targetPath = args[0] ?? session.cwd;
	const absolutePath = resolvePath(session.cwd, targetPath);

	const children = listChildren(fs, absolutePath);
	if (children === null) {
		const node = getNode(fs, absolutePath);
		if (node === null) {
			return createErrorResult(msg(str`ls: No such file or directory: ${targetPath}`, { desc: "ls error" }));
		}
		// It's a file, just show its name
		return createSuccessResult(node.name);
	}

	if (children.length === 0) {
		return createSuccessResult("");
	}

	// Hide resume from visitor when listing root
	let list = children;
	if (
		absolutePath === "/" &&
		session.currentUser === "visitor" &&
		fs.resumePath
	) {
		const resumeName = fs.resumePath.replace(/^\//, "") || "resume";
		list = children.filter((child) => child.name !== resumeName);
	}

	const output = list
		.map((child) => {
			if (child.type === "directory") {
				return `${child.name}/`;
			}
			return child.name;
		})
		.sort()
		.join("  ");

	return createSuccessResult(output);
}

/**
 * Executes the `cd` command.
 * Returns the new cwd if successful.
 */
function executeCd(
	fs: VirtualFilesystem,
	session: Session,
	args: string[],
): { result: CommandResult; newCwd?: string } {
	const targetPath = args[0] ?? "/";
	const absolutePath = resolvePath(session.cwd, targetPath);

	const dir = getDirectory(fs, absolutePath);
	if (dir === null) {
		const node = getNode(fs, absolutePath);
		if (node === null) {
			return {
				result: createErrorResult(
					msg(str`cd: No such file or directory: ${targetPath}`, { desc: "cd error" }),
				),
			};
		}
		return {
			result: createErrorResult(msg(str`cd: Not a directory: ${targetPath}`, { desc: "cd error" })),
		};
	}

	return {
		result: createSuccessResult(""),
		newCwd: absolutePath,
	};
}

/**
 * Executes the `pwd` command.
 */
function executePwd(session: Session): CommandResult {
	return createSuccessResult(session.cwd);
}

/**
 * Executes the `cat` command.
 */
function executeCat(
	fs: VirtualFilesystem,
	session: Session,
	args: string[],
): CommandResult {
	if (args.length === 0) {
		return createErrorResult(msg("cat: missing operand", { desc: "cat error" }));
	}

	const outputs: string[] = [];
	const errors: string[] = [];

	for (const arg of args) {
		const absolutePath = resolvePath(session.cwd, arg);

		// Deny reading resume via cat; only ./resume (with sudo) may reveal it
		if (absolutePath === fs.resumePath) {
			errors.push(msg(str`cat: ${absolutePath}: Permission denied`, { desc: "cat error" }));
			continue;
		}

		const result = readFile(fs, absolutePath);

		if ("error" in result) {
			errors.push(msg(str`cat: ${result.error}`, { desc: "cat error" }));
		} else {
			outputs.push(result.content);
		}
	}

	if (errors.length > 0 && outputs.length === 0) {
		return createErrorResult(errors.join("\n"));
	}

	if (errors.length > 0) {
		return {
			stdout: outputs.join("\n"),
			stderr: errors.join("\n"),
			exitCode: 1,
			resumeRevealed: false,
		};
	}

	return createSuccessResult(outputs.join("\n"));
}

/**
 * Executes the `clear` command.
 * Returns a special marker that the terminal should clear.
 */
function executeClear(): CommandResult {
	return {
		stdout: "\x1b[2J\x1b[H",
		stderr: "",
		exitCode: 0,
		resumeRevealed: false,
	};
}

/**
 * Executes the `whoami` command.
 */
function executeWhoami(session: Session): CommandResult {
	return createSuccessResult(session.currentUser);
}

/**
 * Executes the `echo` command.
 */
function executeEcho(args: string[]): CommandResult {
	return createSuccessResult(args.join(" "));
}

/**
 * Executes the `help` command.
 */
function executeHelp(): CommandResult {
	const helpText = msg(
		`Available commands:
  ls [path]     List directory contents
  cd [path]     Change directory
  pwd           Print working directory
  cat <file>    Display file contents
  clear         Clear the terminal
  whoami        Display current user
  echo [text]   Display text
  help          Show this help message
  su [user]     Switch user (e.g. su gyeonghokim)
  sudo <cmd>    Run command with elevated privileges`,
		{ desc: "Terminal help output" },
	);
	return createSuccessResult(helpText);
}

/**
 * Interface for command execution context.
 */
export interface ExecuteCommandContext {
	fs: VirtualFilesystem;
	session: Session;
	/** Callback to prompt for password input. Returns the entered password. */
	promptPassword?: () => Promise<string>;
}

/**
 * Result of command execution including possible session updates.
 */
export interface ExecuteCommandResult {
	result: CommandResult;
	sessionUpdates?: Partial<Session>;
	/** True when su gyeonghokim was run; widget should prompt for password. */
	needsSuPassword?: true;
}

/**
 * Executes a shell command and returns the result.
 * May also return session updates (new cwd, sudoAuthenticated).
 */
export async function executeCommand(
	line: string,
	context: ExecuteCommandContext,
): Promise<ExecuteCommandResult> {
	const { fs, session, promptPassword } = context;
	const { command, args } = parseCommandLine(line);

	if (!command) {
		return { result: createSuccessResult("") };
	}

	// Handle sudo command
	if (command === "sudo") {
		if (args.length === 0) {
			return {
				result: createErrorResult(msg("usage: sudo command", { desc: "sudo error" })),
			};
		}

		// If already authenticated, just run the command
		if (!session.sudoAuthenticated) {
			// Prompt for password
			if (promptPassword) {
				const password = await promptPassword();
				if (password !== SUDO_PASSWORD) {
					return {
						result: createErrorResult(msg("Sorry, try again.", { desc: "Error message" })),
					};
				}
			} else {
				// No password prompt available, check if session is authenticated
				return {
					result: createErrorResult(msg("Sorry, try again.", { desc: "Error message" })),
				};
			}
		}

		// Execute the sudo'd command
		const sudoedLine = args.join(" ");
		const sudoResult = await executeCommand(sudoedLine, {
			...context,
			session: { ...session, sudoAuthenticated: true },
		});

		return {
			result: sudoResult.result,
			sessionUpdates: {
				...sudoResult.sessionUpdates,
				sudoAuthenticated: true,
			},
		};
	}

	// Handle ./resume command (invisible to visitor)
	if (command === "./resume") {
		if (session.currentUser === "visitor") {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}
		// Must be at root and authenticated
		if (session.cwd !== "/") {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}

		if (!session.sudoAuthenticated) {
			return {
				result: createErrorResult(msg("./resume: Permission denied", { desc: "resume error" })),
			};
		}

		// Check if resume exists and is executable
		if (!isExecutable(fs, "/resume")) {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}

		getFile(fs, "/resume");
		// Do not print file content to terminal; resume viewer overlay shows it.
		return {
			result: {
				stdout: "",
				stderr: "",
				exitCode: 0,
				resumeRevealed: true,
			},
		};
	}

	// Handle su command
	if (command === "su") {
		if (args.length === 0) {
			return {
				result: createErrorResult(msg("Usage: su username", { desc: "su error" })),
			};
		}
		const targetUser = args[0];
		if (targetUser === "visitor") {
			return {
				result: createSuccessResult(""),
				sessionUpdates: { currentUser: "visitor" },
			};
		}
		if (targetUser === "gyeonghokim") {
			return {
				result: createSuccessResult(""),
				needsSuPassword: true,
			};
		}
		return {
			result: createErrorResult(msg(str`su: user ${targetUser} does not exist`, { desc: "su error" })),
		};
	}

	// Regular commands
	switch (command) {
		case "ls":
			return { result: executeLs(fs, session, args) };

		case "cd": {
			const cdResult = executeCd(fs, session, args);
			if (cdResult.newCwd) {
				return {
					result: cdResult.result,
					sessionUpdates: { cwd: cdResult.newCwd },
				};
			}
			return { result: cdResult.result };
		}

		case "pwd":
			return { result: executePwd(session) };

		case "cat":
			return { result: executeCat(fs, session, args) };

		case "clear":
			return { result: executeClear() };

		case "whoami":
			return { result: executeWhoami(session) };

		case "echo":
			return { result: executeEcho(args) };

		case "help":
			return { result: executeHelp() };

		default:
			return {
				result: createErrorResult(msg(str`command not found: ${command}`, { desc: "shell error" })),
			};
	}
}

/**
 * Synchronous version for commands that don't need password prompt.
 * Use executeCommand for full functionality including sudo.
 */
export function executeCommandSync(
	line: string,
	fs: VirtualFilesystem,
	session: Session,
): ExecuteCommandResult {
	const { command, args } = parseCommandLine(line);

	if (!command) {
		return { result: createSuccessResult("") };
	}

	// Handle ./resume command (requires sudo; invisible to visitor)
	if (command === "./resume") {
		if (session.currentUser === "visitor") {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}
		if (session.cwd !== "/") {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}

		if (!session.sudoAuthenticated) {
			return {
				result: createErrorResult(msg("./resume: Permission denied", { desc: "resume error" })),
			};
		}

		if (!isExecutable(fs, "/resume")) {
			return {
				result: createErrorResult(msg("./resume: command not found", { desc: "resume error" })),
			};
		}

		getFile(fs, "/resume");
		// Do not print file content to terminal; resume viewer overlay shows it.
		return {
			result: {
				stdout: "",
				stderr: "",
				exitCode: 0,
				resumeRevealed: true,
			},
		};
	}

	switch (command) {
		case "ls":
			return { result: executeLs(fs, session, args) };

		case "cd": {
			const cdResult = executeCd(fs, session, args);
			if (cdResult.newCwd) {
				return {
					result: cdResult.result,
					sessionUpdates: { cwd: cdResult.newCwd },
				};
			}
			return { result: cdResult.result };
		}

		case "pwd":
			return { result: executePwd(session) };

		case "cat":
			return { result: executeCat(fs, session, args) };

		case "clear":
			return { result: executeClear() };

		case "whoami":
			return { result: executeWhoami(session) };

		case "echo":
			return { result: executeEcho(args) };

		case "help":
			return { result: executeHelp() };

		case "su":
			if (args.length === 0) {
				return { result: createErrorResult(msg("Usage: su username", { desc: "su error" })) };
			}
			if (args[0] === "visitor") {
				return {
					result: createSuccessResult(""),
					sessionUpdates: { currentUser: "visitor" },
				};
			}
			if (args[0] === "gyeonghokim") {
				return {
					result: createSuccessResult(""),
					needsSuPassword: true,
				};
			}
			return {
				result: createErrorResult(msg(str`su: user ${args[0]} does not exist`, { desc: "su error" })),
			};

		case "sudo":
			// Sudo needs password prompt, return error in sync mode
			return {
				result: createErrorResult(msg("sudo: password prompt not available", { desc: "sudo error" })),
			};

		default:
			return {
				result: createErrorResult(msg(str`command not found: ${command}`, { desc: "shell error" })),
			};
	}
}
