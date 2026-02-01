/**
 * Session & Command Result Types
 *
 * Per-session state: current working directory and sudo status.
 * Also includes the CommandResult value object for command execution results.
 */

/**
 * Per-session state for the terminal.
 * Tracks current working directory and sudo authentication status.
 */
export interface Session {
	/** Current working directory (absolute path) */
	cwd: string;
	/** True after successful `sudo` with password 1116 */
	sudoAuthenticated: boolean;
}

/**
 * Creates a new session with default values.
 * CWD starts at root (`/`), sudo is not authenticated.
 */
export function createSession(): Session {
	return {
		cwd: "/",
		sudoAuthenticated: false,
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
