export function formatDate(date: Date | null, alt: string): string {
	if (!date) return alt;

	const day = date.getDate().toString().padStart(2, '0'); // Giorno a due cifre
	const monthNames = [
		'gen',
		'feb',
		'mar',
		'apr',
		'mag',
		'giu',
		'lug',
		'ago',
		'set',
		'ott',
		'nov',
		'dic'
	]; // Nomi mesi in italiano
	const month = monthNames[date.getMonth()]; // Ottieni nome del mese
	const year = date.getFullYear(); // Anno
	const hours = date.getHours().toString().padStart(2, '0'); // Ore a due cifre
	const minutes = date.getMinutes().toString().padStart(2, '0'); // Minuti a due cifre
	const seconds = date.getSeconds().toString().padStart(2, '0'); // Secondi a due cifre

	return `${day} ${month} ${year} - ${hours}:${minutes}:${seconds}`;
}

// Capitalize first letter of every word in a string
export function capitalizeFirstLetter(str: string): string {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Generic function that given a string returns the enum value
export function getEnumValueFromString<T>(enumType: T, value: string): T[keyof T] {
	return enumType[value as keyof T];
}

// Generic function that given an enum value returns the string
export function getStringFromEnumValue<T extends object>(enumType: T, value: T[keyof T]): string {
    return (Object.keys(enumType) as Array<keyof T>).find(key => enumType[key] === value) as string;
}

// PERMISSIONS UTILS
export function addPermission(currentPermissions: number, permission: number): number {
	return currentPermissions | permission;
}

export function removePermission(currentPermissions: number, permission: number): number {
	return currentPermissions & ~permission;
}

export function hasPermission(currentPermissions?: number, permission?: number): boolean {
	if (!currentPermissions)
		return false;

	if (!permission)
		return true;

	return (currentPermissions & permission) === permission;
}

export function intToBitArray(num: number, length: number): number[] {
	const bitString = num.toString(2).padStart(length, '0');
	return bitString.split('').map(bit => parseInt(bit));
}