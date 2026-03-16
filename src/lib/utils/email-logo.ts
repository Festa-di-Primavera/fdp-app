import { dev } from "$app/environment";
import type { Attachment } from "resend";
import { DOMAIN } from "./domain";

let cachedLogoBuffer: Buffer | null = null;

async function fetchLogoBuffer(): Promise<Buffer> {
    if (!cachedLogoBuffer) {
        const baseUrl = dev ? "http://localhost:5173" : `https://${DOMAIN}`;
        const response = await fetch(`${baseUrl}/logo.png`);
        if (!response.ok) {
            throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
        }
        cachedLogoBuffer = Buffer.from(await response.arrayBuffer());
    }
    return cachedLogoBuffer;
}

/** Returns the logo.png as an inline CID attachment (referenced as `cid:logo` in HTML). */
export async function getLogoCidAttachment(): Promise<Attachment> {
    return {
        filename: "logo.png",
        content: await fetchLogoBuffer(),
        contentId: "logo",
    };
}
