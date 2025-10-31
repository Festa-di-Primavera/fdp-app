import QRCode from "qrcode";
import logoSvg from "$lib/assets/logo.svg?raw";

export async function generateQRCodeBase64(ticketId: string): Promise<string> {
    const qrDataURL = await QRCode.toDataURL(ticketId, {
        type: "image/png",
        width: 180,
        margin: 1,
        errorCorrectionLevel: "H",
    });
    return qrDataURL;
}

export function getLogoBase64(): string {
    return `data:image/svg+xml;base64,${btoa(logoSvg)}`;
}
