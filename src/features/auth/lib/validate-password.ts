/**
 * Client-side credential validation for gyeonghokim (per spec; no backend).
 * Internal use: expected password is hardcoded or from env.
 */

const EXPECTED_PASSWORD = "1116"; // Internal use per spec assumptions

export function validateGyeonghokimPassword(password: string): boolean {
	return password === EXPECTED_PASSWORD;
}
