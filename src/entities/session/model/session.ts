/**
 * Session & Command Result Types
 *
 * Per-session state: current working directory and sudo status.
 * Also includes the CommandResult value object for command execution results.
 */

/**
 * Shell user identity for the terminal session.
 */
export type ShellUser = "visitor" | "gyeonghokim";

/**
 * Per-session state for the terminal.
 * Tracks current working directory, sudo authentication status, current shell user,
 * and the connected device IP for network simulation.
 */
export interface Session {
	/** Current working directory (absolute path) */
	cwd: string;
	/** True after successful `sudo` with password 1116 */
	sudoAuthenticated: boolean;
	/** Current shell user (visitor or gyeonghokim) */
	currentUser: ShellUser;
	/** IP address of the device the user is currently connected to */
	connectedDeviceIp: string;
	/** Command history for up arrow navigation (optional) */
	history: string[];
}

/**
 * Creates a new session with default values.
 * CWD starts at root (`/`), sudo is not authenticated.
 * Visitor starts connected to their own device (192.168.1.10).
 */
export function createSession(connectedDeviceIp = "192.168.1.10"): Session {
	return {
		cwd: "/",
		sudoAuthenticated: false,
		currentUser: "visitor",
		connectedDeviceIp,
		history: [],
	};
}

/**
 * Result of executing one shell command (for terminal output).
 */
export interface CommandResult {
	/** Normal output (e.g. ls listing, cat content) */
	stdout: string;
	/** Error message (e.g. "Permission denied", "No such file") */
	stderr: string;
	/** 0 = success; non-zero = failure */
	exitCode: number;
	/** True if this command revealed the resume (e.g. after ./resume) */
	resumeRevealed: boolean;
}

/**
 * Creates a successful command result.
 */
export function createSuccessResult(
	stdout: string,
	options?: { resumeRevealed?: boolean },
): CommandResult {
	return {
		stdout,
		stderr: "",
		exitCode: 0,
		resumeRevealed: options?.resumeRevealed ?? false,
	};
}

/**
 * Creates an error command result.
 */
export function createErrorResult(stderr: string): CommandResult {
	return {
		stdout: "",
		stderr,
		exitCode: 1,
		resumeRevealed: false,
	};
}
