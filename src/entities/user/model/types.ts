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

/** Fixed list of users for this feature (per spec). */
export const USERS: readonly User[] = [
	{ id: "gyeonghokim", displayName: "gyeonghokim", role: "authenticated" },
	{ id: "visitor", displayName: "visitor", role: "visitor" },
] as const;

export function getUserById(id: string): User | undefined {
	return USERS.find((u) => u.id === id);
}
