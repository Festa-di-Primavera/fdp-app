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

export function hasAnyPermissions(
    currentPermissions?: number,
    permission?: number | number[]
): boolean {
    if (!currentPermissions) return false;

    if (!permission) return true;

    if (Array.isArray(permission)) {
        return permission.some((p) => (currentPermissions & p) === p);
    }

    return (currentPermissions & permission) === permission;
}

export function intToBitArray(num: number, length: number): number[] {
    const bitString = num.toString(2).padStart(length, "0");
    return bitString.split("").map((bit) => parseInt(bit));
}