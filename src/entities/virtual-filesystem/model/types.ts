/**
 * Virtual Filesystem Types
 *
 * Represents a single node in the virtual filesystem (file or directory).
 * Used for the terminal game where visitors navigate a virtual FS.
 */

/**
 * Base interface for all filesystem nodes.
 */
export interface VirtualNode {
	/** Display name (e.g. `README`, `resume`, `home`) */
	name: string;
	/** Absolute path (e.g. `/`, `/home`, `/README`) */
	path: string;
	/** Node kind */
	type: "file" | "directory";
	/** Parent directory; null for root */
	parent: VirtualNode | null;
}

/**
 * File node with content.
 */
export interface VirtualFile extends VirtualNode {
	type: "file";
	/** Raw text content (e.g. README body, resume body) */
	content: string;
	/** If true, can be executed (e.g. `resume` at root) */
	executable: boolean;
}

/**
 * Directory node with children.
 */
export interface VirtualDirectory extends VirtualNode {
	type: "directory";
	/** Name → child node (no duplicate names) */
	children: Map<string, VirtualNode>;
}

/**
 * Type guard to check if a node is a VirtualFile.
 */
export function isVirtualFile(node: VirtualNode): node is VirtualFile {
	return node.type === "file";
}

/**
 * Type guard to check if a node is a VirtualDirectory.
 */
export function isVirtualDirectory(
	node: VirtualNode,
): node is VirtualDirectory {
	return node.type === "directory";
}
