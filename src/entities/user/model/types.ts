/**
 * User entity — selectable user on the login screen.
 * Per data-model: id, displayName, role; no persistence.
 */

export type UserRole = "authenticated" | "visitor";

export interface User {
	/** Stable identifier, e.g. gyeonghokim, visitor */
	id: string;
	/** Label shown on login screen */
	displayName: string;
	/** Visitor = no credentials; authenticated = password required */
	role: UserRole;
}

/**
 * Fixed list of users available for local login.
 * Note: gyeonghokim is a remote user on a different device (192.168.1.20)
 * and can only be accessed via SSH, not through the login screen.
 */
export const USERS: readonly User[] = [
	{ id: "visitor", displayName: "visitor", role: "visitor" },
] as const;

export function getUserById(id: string): User | undefined {
	return USERS.find((u) => u.id === id);
}
