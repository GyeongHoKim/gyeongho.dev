/**
 * Virtual Filesystem Helpers
 *
 * Provides lookup and navigation utilities for the virtual filesystem.
 */

import {
	type VirtualDirectory,
	type VirtualFile,
	type VirtualNode,
	isVirtualDirectory,
	isVirtualFile,
} from "../model/types.ts";

/**
 * Root of the virtual FS; provides lookup and navigation.
 */
export interface VirtualFilesystem {
	/** Root directory (path `/`) */
	root: VirtualDirectory;
	/** Absolute path to README (hint 1116) */
	readmePath: string;
	/** Absolute path to resume executable (e.g. `/resume`) */
	resumePath: string;
}

/**
 * Normalizes a path by resolving `.` and `..` segments and ensuring it starts with `/`.
 */
export function normalizePath(path: string): string {
	// Handle empty or relative paths
	if (!path || path === "") {
		return "/";
	}

	// Split by / and filter empty segments
	const segments = path.split("/").filter((s) => s !== "" && s !== ".");
	const result: string[] = [];

	for (const segment of segments) {
		if (segment === "..") {
			if (result.length > 0) {
				result.pop();
			}
		} else {
			result.push(segment);
		}
	}

	return `/${result.join("/")}`;
}

/**
 * Resolves a path relative to a current working directory.
 */
export function resolvePath(cwd: string, targetPath: string): string {
	if (targetPath.startsWith("/")) {
		return normalizePath(targetPath);
	}
	return normalizePath(`${cwd}/${targetPath}`);
}

/**
 * Gets a node at the specified absolute path from the filesystem.
 * Returns null if the path does not exist.
 */
export function getNode(
	fs: VirtualFilesystem,
	absolutePath: string,
): VirtualNode | null {
	const normalizedPath = normalizePath(absolutePath);

	if (normalizedPath === "/") {
		return fs.root;
	}

	const segments = normalizedPath.split("/").filter((s) => s !== "");
	let current: VirtualNode = fs.root;

	for (const segment of segments) {
		if (!isVirtualDirectory(current)) {
			return null;
		}
		const child = current.children.get(segment);
		if (!child) {
			return null;
		}
		current = child;
	}

	return current;
}

/**
 * Lists children of a directory at the specified path.
 * Returns null if the path does not exist or is not a directory.
 */
export function listChildren(
	fs: VirtualFilesystem,
	absolutePath: string,
): VirtualNode[] | null {
	const node = getNode(fs, absolutePath);
	if (!node || !isVirtualDirectory(node)) {
		return null;
	}
	return Array.from(node.children.values());
}

/**
 * Reads the content of a file at the specified path.
 * Returns an object with content or an error message.
 */
export function readFile(
	fs: VirtualFilesystem,
	absolutePath: string,
): { content: string } | { error: string } {
	const node = getNode(fs, absolutePath);

	if (!node) {
		return { error: `No such file or directory: ${absolutePath}` };
	}

	if (isVirtualDirectory(node)) {
		return { error: `Is a directory: ${absolutePath}` };
	}

	if (isVirtualFile(node)) {
		return { content: node.content };
	}

	return { error: `Unknown node type: ${absolutePath}` };
}

/**
 * Checks if a node at the specified path is executable.
 */
export function isExecutable(
	fs: VirtualFilesystem,
	absolutePath: string,
): boolean {
	const node = getNode(fs, absolutePath);
	return node !== null && isVirtualFile(node) && node.executable;
}

/**
 * Gets the file at the specified path if it exists and is a file.
 */
export function getFile(
	fs: VirtualFilesystem,
	absolutePath: string,
): VirtualFile | null {
	const node = getNode(fs, absolutePath);
	if (node && isVirtualFile(node)) {
		return node;
	}
	return null;
}

/**
 * Gets the directory at the specified path if it exists and is a directory.
 */
export function getDirectory(
	fs: VirtualFilesystem,
	absolutePath: string,
): VirtualDirectory | null {
	const node = getNode(fs, absolutePath);
	if (node && isVirtualDirectory(node)) {
		return node;
	}
	return null;
}

// Re-export types and type guards for convenience
export {
	type VirtualDirectory,
	type VirtualFile,
	type VirtualNode,
	isVirtualDirectory,
	isVirtualFile,
};
