export function addPermission(
    currentPermissions: number,
    permission: number
): number {
    return currentPermissions | permission;
}

export function removePermission(
    currentPermissions: number,
    permission: number
): number {
    return currentPermissions & ~permission;
}

export function hasPermission(
    currentPermissions?: number,
    permission?: number
): boolean {
    if (!currentPermissions) return false;

    if (!permission) return true;

    return (currentPermissions & permission) === permission;
}

export function intToBitArray(num: number, length: number): number[] {
    const bitString = num.toString(2).padStart(length, "0");
    return bitString.split("").map((bit) => parseInt(bit));
}