/** "MM.DD" in UTC, so a date written as 2026-11-16 never shifts a day. */
export function monthDay(date: Date): string {
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${month}.${day}`;
}

/** "YYYY.MM.DD" in UTC. */
export function fullDate(date: Date): string {
	return `${date.getUTCFullYear()}.${monthDay(date)}`;
}
