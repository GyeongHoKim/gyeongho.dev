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
	writeFile,
} from "../../../entities/virtual-filesystem/lib/fs-helpers.ts";
import type { CommandResult } from "../../../entities/session/model/session.ts";
import { CommandRegistry } from "./command-registry.ts";
import { executeArp } from "./commands/arp.ts";
import { executePing } from "./commands/ping.ts";
import { executeNmap } from "./commands/nmap.ts";
import { executeSsh } from "./commands/ssh.ts";
import { executeFind } from "./commands/find.ts";
import { executeId } from "./commands/id.ts";
import { executeCurl } from "./commands/curl.ts";
import { executeEdit } from "./commands/edit.ts";

const SUDO_PASSWORD = "1116";

/**
 * Parses a command line into command name, arguments, and optional redirection.
 * Handles quoted strings (single and double quotes).
 */
function parseCommandLine(line: string): {
	command: string;
	args: string[];
	redirect?: { type: ">" | ">>"; target: string };
} {
	const trimmed = line.trim();
	if (!trimmed) {
		return { command: "", args: [] };
	}

	// Tokenize handling quoted strings
	const tokens: string[] = [];
	let current = "";
	let inSingleQuote = false;
	let inDoubleQuote = false;

	for (let i = 0; i < trimmed.length; i++) {
		const char = trimmed[i];

		if (char === "'" && !inDoubleQuote) {
			inSingleQuote = !inSingleQuote;
		} else if (char === '"' && !inSingleQuote) {
			inDoubleQuote = !inDoubleQuote;
		} else if (char === " " && !inSingleQuote && !inDoubleQuote) {
			if (current) {
				tokens.push(current);
				current = "";
			}
		} else {
			current += char;
		}
	}
	if (current) {
		tokens.push(current);
	}

	// Check for redirection (> or >>)
	let redirect: { type: ">" | ">>"; target: string } | undefined;
	const redirectIndex = tokens.findIndex((t) => t === ">" || t === ">>");
	if (redirectIndex !== -1 && redirectIndex < tokens.length - 1) {
		redirect = {
			type: tokens[redirectIndex] as ">" | ">>",
			target: tokens[redirectIndex + 1],
		};
		// Remove redirect and target from tokens
		tokens.splice(redirectIndex, 2);
	}

	return {
		command: tokens[0] || "",
		args: tokens.slice(1),
		redirect,
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
			return createErrorResult(
				msg(str`ls: No such file or directory: ${targetPath}`, {
					desc: "ls error",
				}),
			);
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
					msg(str`cd: No such file or directory: ${targetPath}`, {
						desc: "cd error",
					}),
				),
			};
		}
		return {
			result: createErrorResult(
				msg(str`cd: Not a directory: ${targetPath}`, { desc: "cd error" }),
			),
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
		return createErrorResult(
			msg("cat: missing operand", { desc: "cat error" }),
		);
	}

	const outputs: string[] = [];
	const errors: string[] = [];

	for (const arg of args) {
		const absolutePath = resolvePath(session.cwd, arg);

		if (absolutePath === fs.resumePath) {
			errors.push(
				msg(str`cat: ${absolutePath}: Permission denied`, {
					desc: "cat error",
				}),
			);
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
  Filesystem:
    ls [path]        List directory contents
    cd [path]        Change directory
    pwd              Print working directory
    cat <file>       Display file contents
    find [path] -name <pattern>  Search for files
    echo <text> > <file>  Write text to file
    edit <file>      Open file in text editor

  Network:
    arp -a           Display ARP table
    ping <ip>        Check host reachability
    nmap <ip>        Scan for open ports
    ssh <user>@<ip>  Connect to remote host
    curl <url>       Transfer data from URL

  System:
    clear            Clear the terminal
    whoami           Display current user
    id               Display user identity
    echo [text]      Display text
    help             Show this help message
    sudo <cmd>       Run command with elevated privileges`,
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
	needsSuPassword?: true;
	needsSshPassword?: {
		ip: string;
		user: "visitor" | "gyeonghokim";
	};
}

const commandRegistry = new CommandRegistry();

/**
 * Initializes the command registry with built-in commands.
 */
function initializeCommandRegistry(): void {
	commandRegistry.register({
		name: "ls",
		description: "List directory contents",
		usage: "ls [path]",
		handler: (args, context) => {
			return { result: executeLs(context.fs, context.session, args) };
		},
	});

	commandRegistry.register({
		name: "cd",
		description: "Change directory",
		usage: "cd [path]",
		handler: (args, context) => {
			const cdResult = executeCd(context.fs, context.session, args);
			if (cdResult.newCwd) {
				return {
					result: cdResult.result,
					sessionUpdates: { cwd: cdResult.newCwd },
				};
			}
			return { result: cdResult.result };
		},
	});

	commandRegistry.register({
		name: "pwd",
		description: "Print working directory",
		usage: "pwd",
		handler: (_args, context) => {
			return { result: executePwd(context.session) };
		},
	});

	commandRegistry.register({
		name: "cat",
		description: "Display file contents",
		usage: "cat <file> [file...]",
		handler: (args, context) => {
			return { result: executeCat(context.fs, context.session, args) };
		},
	});

	commandRegistry.register({
		name: "clear",
		description: "Clear the terminal screen",
		usage: "clear",
		handler: () => {
			return { result: executeClear() };
		},
	});

	commandRegistry.register({
		name: "whoami",
		description: "Display current user",
		usage: "whoami",
		handler: (_args, context) => {
			return { result: executeWhoami(context.session) };
		},
	});

	commandRegistry.register({
		name: "echo",
		description: "Display text",
		usage: "echo [text...]",
		handler: (args) => {
			return { result: executeEcho(args) };
		},
	});

	commandRegistry.register({
		name: "help",
		description: "Show available commands",
		usage: "help",
		handler: () => {
			return { result: executeHelp() };
		},
	});

	commandRegistry.register({
		name: "arp",
		description: "Display ARP table",
		usage: "arp -a",
		handler: executeArp,
	});

	commandRegistry.register({
		name: "ping",
		description: "Check host reachability",
		usage: "ping <ip>",
		handler: executePing,
	});

	commandRegistry.register({
		name: "nmap",
		description: "Scan for open ports",
		usage: "nmap <ip>",
		handler: executeNmap,
	});

	commandRegistry.register({
		name: "ssh",
		description: "Connect to remote host",
		usage: "ssh <user>@<ip>",
		handler: executeSsh,
	});

	commandRegistry.register({
		name: "find",
		description: "Search for files",
		usage: "find [path] -name <pattern>",
		handler: executeFind,
	});

	commandRegistry.register({
		name: "id",
		description: "Display user identity",
		usage: "id",
		handler: executeId,
	});

	commandRegistry.register({
		name: "curl",
		description: "Transfer data from URL",
		usage: "curl [options] <url>",
		handler: executeCurl,
	});

	commandRegistry.register({
		name: "edit",
		description: "Open file in text editor",
		usage: "edit <filename>",
		handler: executeEdit,
	});
}

initializeCommandRegistry();

/**
 * Gets the command registry instance.
 */
export function getCommandRegistry(): CommandRegistry {
	return commandRegistry;
}

/**
 * Executes a shell command and returns the result.
 */
export async function executeCommand(
	line: string,
	context: ExecuteCommandContext,
): Promise<ExecuteCommandResult> {
	const { fs, session } = context;
	const { command, args, redirect } = parseCommandLine(line);

	if (!command) {
		return { result: createSuccessResult("") };
	}

	// Handle redirection: execute command and write output to file
	if (redirect) {
		// First execute the command normally
		const cmdResult = await executeCommandWithoutRedirect(
			command,
			args,
			context,
		);

		if (cmdResult.result.exitCode !== 0) {
			return cmdResult;
		}

		// Write stdout to file
		const targetPath = resolvePath(session.cwd, redirect.target);
		let content = cmdResult.result.stdout;

		// For append mode (>>), read existing content first
		if (redirect.type === ">>") {
			const existingFile = readFile(fs, targetPath);
			if ("content" in existingFile) {
				content = existingFile.content + content;
			}
		}

		const writeResult = writeFile(fs, targetPath, content);
		if ("error" in writeResult) {
			return {
				result: createErrorResult(
					msg(str`${command}: cannot write to ${redirect.target}: ${writeResult.error}`, {
						desc: "redirect error",
					}),
				),
			};
		}

		return {
			result: createSuccessResult(""),
			sessionUpdates: cmdResult.sessionUpdates,
		};
	}

	return executeCommandWithoutRedirect(command, args, context);
}

/**
 * Internal: executes command without handling redirection.
 */
async function executeCommandWithoutRedirect(
	command: string,
	args: string[],
	context: ExecuteCommandContext,
): Promise<ExecuteCommandResult> {
	const { fs, session, promptPassword } = context;

	if (command === "sudo") {
		if (args.length === 0) {
			return {
				result: createErrorResult(
					msg("usage: sudo command", { desc: "sudo error" }),
				),
			};
		}

		if (!session.sudoAuthenticated) {
			if (promptPassword) {
				const password = await promptPassword();
				if (password !== SUDO_PASSWORD) {
					return {
						result: createErrorResult(
							msg("Sorry, try again.", { desc: "Error message" }),
						),
					};
				}
			} else {
				// No password prompt available, check if session is authenticated
				return {
					result: createErrorResult(
						msg("Sorry, try again.", { desc: "Error message" }),
					),
				};
			}
		}

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

	if (command === "./resume") {
		if (session.currentUser === "visitor") {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
			};
		}
		if (session.cwd !== "/") {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
			};
		}

		if (!session.sudoAuthenticated) {
			return {
				result: createErrorResult(
					msg("./resume: Permission denied", { desc: "resume error" }),
				),
			};
		}

		// Check if resume exists and is executable
		if (!isExecutable(fs, "/resume")) {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
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

	if (command === "su") {
		if (args.length === 0) {
			return {
				result: createErrorResult(
					msg("Usage: su username", { desc: "su error" }),
				),
			};
		}
		const targetUser = args[0];
		if (targetUser === "visitor") {
			return {
				result: createSuccessResult(""),
				sessionUpdates: { currentUser: "visitor" },
			};
		}
		// gyeonghokim is not a local user
		return {
			result: createErrorResult(
				msg(str`su: user ${targetUser} does not exist`, { desc: "su error" }),
			),
		};
	}

	// Check if command is registered in the registry
	if (commandRegistry.has(command)) {
		return await commandRegistry.execute(command, args, context);
	}

	// Command not found
	return {
		result: createErrorResult(
			msg(str`command not found: ${command}`, { desc: "shell error" }),
		),
	};
}

/**
 * Synchronous version for commands that don't need password prompt.
 */
export function executeCommandSync(
	line: string,
	fs: VirtualFilesystem,
	session: Session,
): ExecuteCommandResult {
	const { command, args, redirect } = parseCommandLine(line);

	if (!command) {
		return { result: createSuccessResult("") };
	}

	// Handle redirection in sync mode
	if (redirect) {
		const cmdResult = executeCommandSyncInternal(command, args, fs, session);

		if (cmdResult.result.exitCode !== 0) {
			return cmdResult;
		}

		const targetPath = resolvePath(session.cwd, redirect.target);
		let content = cmdResult.result.stdout;

		if (redirect.type === ">>") {
			const existingFile = readFile(fs, targetPath);
			if ("content" in existingFile) {
				content = existingFile.content + content;
			}
		}

		const writeResult = writeFile(fs, targetPath, content);
		if ("error" in writeResult) {
			return {
				result: createErrorResult(
					msg(str`${command}: cannot write to ${redirect.target}: ${writeResult.error}`, {
						desc: "redirect error",
					}),
				),
			};
		}

		return {
			result: createSuccessResult(""),
			sessionUpdates: cmdResult.sessionUpdates,
		};
	}

	return executeCommandSyncInternal(command, args, fs, session);
}

/**
 * Internal sync command execution without redirection handling.
 */
function executeCommandSyncInternal(
	command: string,
	args: string[],
	fs: VirtualFilesystem,
	session: Session,
): ExecuteCommandResult {
	if (command === "./resume") {
		if (session.currentUser === "visitor") {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
			};
		}
		if (session.cwd !== "/") {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
			};
		}

		if (!session.sudoAuthenticated) {
			return {
				result: createErrorResult(
					msg("./resume: Permission denied", { desc: "resume error" }),
				),
			};
		}

		if (!isExecutable(fs, "/resume")) {
			return {
				result: createErrorResult(
					msg("./resume: command not found", { desc: "resume error" }),
				),
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

	if (command === "su") {
		if (args.length === 0) {
			return {
				result: createErrorResult(
					msg("Usage: su username", { desc: "su error" }),
				),
			};
		}
		if (args[0] === "visitor") {
			return {
				result: createSuccessResult(""),
				sessionUpdates: { currentUser: "visitor" },
			};
		}
		// gyeonghokim is not a local user
		return {
			result: createErrorResult(
				msg(str`su: user ${args[0]} does not exist`, { desc: "su error" }),
			),
		};
	}

	if (command === "sudo") {
		return {
			result: createErrorResult(
				msg("sudo: password prompt not available", { desc: "sudo error" }),
			),
		};
	}

	// Check if command is registered in the registry
	if (commandRegistry.has(command)) {
		const context = { fs, session };
		const cmd = commandRegistry.get(command);
		if (!cmd) {
			return {
				result: createErrorResult(
					msg(str`command not found: ${command}`, { desc: "shell error" }),
				),
			};
		}
		const result = cmd.handler(args, context);
		if (result instanceof Promise) {
			return {
				result: createErrorResult(
					msg(str`${command}: async commands not supported in sync mode`, {
						desc: "shell error",
					}),
				),
			};
		}
		return result;
	}

	// Command not found
	return {
		result: createErrorResult(
			msg(str`command not found: ${command}`, { desc: "shell error" }),
		),
	};
}
