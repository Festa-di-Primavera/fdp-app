import type { User } from "$lib/auth/user";

export const OFFSET = 45150;

export function getFdPCode(code: string | undefined): string | null {
    try {
        if (code === undefined || code === null) return null;

        code = decodeURIComponent(code);
    } catch {
        return null;
    }

    if (code.includes("FDP25")) return code;

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

export function getXnrfCode(code: string | undefined): string | null {
    try {
        if (code === undefined || code === null) return null;

        code = decodeURIComponent(code);
    } catch {
        return null;
    }

    if (code.includes("XNRF"))
        return code.replace("XNRF", "").replace("/25", "").trim();

    if (code.includes("FDP25")) {
        code = code.replace("FDP25-", "");
        code = code.trim();

        let num = parseInt(code);
        num += OFFSET;

        let str = num.toString();
        while (str.length < 5) {
            str = "0" + str;
        }
        return str;
    }

    return null;
}

export type Block = {
    id: string;
    assigned_to: User | null;
    assigned_by: User | null;
    assigned_at: Date | null;
};

export function getFirstCodeOfBlock(inputCode: string): string {
    // check if the format is XNRF 4xxxx
    if (!/^XNRF\s\d{5}$/.test(inputCode)) {
        throw new Error("Invalid block code");
    }

    // check if the number is between 45151 and 46400
    if (
        parseInt(inputCode.slice(5)) < 45151 ||
        parseInt(inputCode.slice(5)) > 46400
    ) {
        throw new Error("Invalid block number");
    }

    const blockNumber =
        Math.floor((parseInt(inputCode.slice(5)) - 1) / 50) * 50 + 1;

    const firstCodeOfBlock = `XNRF ${blockNumber.toString().padStart(5, "0")}`;
    return firstCodeOfBlock;
}
