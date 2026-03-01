import { readFileSync } from "fs";
import { resolve } from "path";
import type { Attachment } from "resend";

let cachedLogoBuffer: Buffer | null = null;

function getLogoBuffer(): Buffer {
    if (!cachedLogoBuffer) {
        cachedLogoBuffer = readFileSync(resolve("static/logo.png"));
    }
    return cachedLogoBuffer;
}

/** Returns the logo.png as an inline CID attachment (referenced as `cid:logo` in HTML). */
export function getLogoCidAttachment(): Attachment {
    return {
        filename: "logo.png",
        content: getLogoBuffer(),
		contentId: "logo"
    };
}
