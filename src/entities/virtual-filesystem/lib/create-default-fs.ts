/**
 * Default Virtual Filesystem Factory
 *
 * Creates the default virtual filesystem with:
 * - README file containing the hint 1116
 * - resume executable at root
 * - Basic directory structure for exploration
 */

import type { VirtualDirectory, VirtualFile } from "../model/types.ts";
import type { VirtualFilesystem } from "./fs-helpers.ts";

/**
 * Helper to create a file node.
 */
function createFile(
	name: string,
	path: string,
	content: string,
	parent: VirtualDirectory | null,
	executable = false,
): VirtualFile {
	return {
		name,
		path,
		type: "file",
		parent,
		content,
		executable,
	};
}

/**
 * Helper to create a directory node.
 */
function createDirectory(
	name: string,
	path: string,
	parent: VirtualDirectory | null,
): VirtualDirectory {
	return {
		name,
		path,
		type: "directory",
		parent,
		children: new Map(),
	};
}

/**
 * Resume content to display when unlocked.
 */
const RESUME_CONTENT = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                              GYEONGHO KIM                                    ║
║                           Software Engineer                                  ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ABOUT                                                                       ║
║  ─────                                                                       ║
║  Passionate software engineer who loves building creative web experiences.   ║
║  Always exploring new technologies and pushing the boundaries of what's      ║
║  possible on the web.                                                        ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  SKILLS                                                                      ║
║  ──────                                                                      ║
║  • TypeScript / JavaScript      • React / Lit                                ║
║  • Node.js                      • Python                                     ║
║  • Web APIs                     • Cloud Services                             ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  CONTACT                                                                     ║
║  ───────                                                                     ║
║  Email: hello@gyeongho.dev                                                   ║
║  GitHub: github.com/gyeongho                                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`.trim();

/**
 * README content containing the hint 1116.
 */
const README_CONTENT = `
Welcome to my personal terminal!

This is a virtual filesystem where you can explore and discover my story.

Commands available:
  ls      - list directory contents
  cd      - change directory
  pwd     - print working directory
  cat     - display file contents
  clear   - clear the terminal screen

Hint: My birthday is November 16th (1116). Maybe that information will be 
useful somewhere... 🤔

Happy exploring!
`.trim();

/**
 * Creates the default virtual filesystem for the terminal game.
 */
export function createDefaultFilesystem(): VirtualFilesystem {
	// Create root directory
	const root = createDirectory("/", "/", null);

	// Create home directory
	const home = createDirectory("home", "/home", root);
	root.children.set("home", home);

	// Create user directory inside home
	const user = createDirectory("user", "/home/user", home);
	home.children.set("user", user);

	// Create README in user directory
	const readme = createFile(
		"README",
		"/home/user/README",
		README_CONTENT,
		user,
	);
	user.children.set("README", readme);

	// Create documents directory with some files
	const documents = createDirectory("documents", "/home/user/documents", user);
	user.children.set("documents", documents);

	const notesFile = createFile(
		"notes.txt",
		"/home/user/documents/notes.txt",
		"Some random notes...\nNothing special here.",
		documents,
	);
	documents.children.set("notes.txt", notesFile);

	// Create etc directory
	const etc = createDirectory("etc", "/etc", root);
	root.children.set("etc", etc);

	const hostsFile = createFile(
		"hosts",
		"/etc/hosts",
		"127.0.0.1   localhost\n::1         localhost",
		etc,
	);
	etc.children.set("hosts", hostsFile);

	// Create resume executable at root
	const resume = createFile("resume", "/resume", RESUME_CONTENT, root, true);
	root.children.set("resume", resume);

	return {
		root,
		readmePath: "/home/user/README",
		resumePath: "/resume",
	};
}
