import type { User } from "$lib/auth/user";

export const OFFSET = import.meta.env.VITE_TICKETS_OFFSET;

export function getFdPOrStaffCode(code: string | undefined): string | null {
    try {
        if (code === undefined || code === null) return null;
        code = decodeURIComponent(code);
    } catch {
        return null;
    }

    if (code.startsWith("STAFF") || code.includes("FDP25")) return code;

    if (code.includes("XNRF")) {
        code = code.replace("XNRF", "");
        code = code.replace("/25", "");
        code = code.trim();

        let num = parseInt(code);
        num -= OFFSET;

        let str = num.toString();
        while (str.length < 4) {
            str = "0" + str;
        }
        return `FDP25-${str}`;
    }

    return null;
}

export type Block = {
    id: string;
    assigned_to: User | null;
    assigned_by: User | null;
    assigned_at: Date | null;
};