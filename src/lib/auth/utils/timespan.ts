import type { TimeSpan } from "$models/timespan";

export function createDate(timeSpan: TimeSpan): Date {
	return new Date(Date.now() + timeSpan.milliseconds());
}

export function isWithinExpirationDate(date: Date): boolean {
	return Date.now() < date.getTime();
}