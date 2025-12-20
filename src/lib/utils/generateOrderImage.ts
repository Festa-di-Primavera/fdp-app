import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { Order } from "$models/order";

// Fetch Inter font from CDN
async function loadFont(): Promise<ArrayBuffer> {
    const response = await fetch(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff"
    );
    if (!response.ok) {
        throw new Error(`Failed to load font: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
}

export async function generateOrderImage(
    order: Order,
    qrCodeBase64: string,
    logoBase64: string
): Promise<Buffer> {
    const fontData = await loadFont();
    
    const svg = await satori(
        {
            type: "div",
            props: {
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#000000",
                },
                children: {
                    type: "div",
                    props: {
                        style: {
                            backgroundColor: "#000000",
                            padding: "40px",
                            width: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        },
                        children: [
                            // Logo
                            {
                                type: "img",
                                props: {
                                    src: logoBase64,
                                    width: 200,
                                    height: 100,
                                    style: {
                                        borderRadius: "8px",
                                        marginBottom: "30px",
                                    },
                                },
                            },
                            // User Info
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        justifyContent: "center",
                                        padding: "30px 0",
                                        marginBottom: "30px",
                                        borderTop: "1px solid #3DDC84",
                                        borderBottom: "1px solid #3DDC84",
                                        width: "100%",
                                    },
                                    children: {
                                        type: "span",
                                        props: {
                                            style: {
                                                fontSize: "28px",
                                                color: "#ffffff",
                                                fontWeight: 600,
                                                letterSpacing: "0.5px",
                                                textAlign: "center",
                                            },
                                            children: `${order.name} ${order.surname}`,
                                        },
                                    },
                                },
                            },
                            // Ticket Section
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        marginBottom: "30px",
                                    },
                                    children: [
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "14px",
                                                    color: "#3DDC84",
                                                    marginBottom: "8px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "1px",
                                                },
                                                children: "Codice Biglietto",
                                            },
                                        },
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    fontSize: "24px",
                                                    color: "#ffffff",
                                                    fontWeight: 600,
                                                    fontFamily: "monospace",
                                                    letterSpacing: "2px",
                                                },
                                                children: order.ticketId,
                                            },
                                        },
                                    ],
                                },
                            },
                            // QR Code Section
                            {
                                type: "div",
                                props: {
                                    style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                    },
                                    children: [
                                        {
                                            type: "img",
                                            props: {
                                                src: qrCodeBase64,
                                                width: 200,
                                                height: 200,
                                                style: {
                                                    borderRadius: "4px",
                                                    backgroundColor: "#e0e0e0",
                                                },
                                            },
                                        },
                                        {
                                            type: "span",
                                            props: {
                                                style: {
                                                    color: "#999999",
                                                    fontSize: "12px",
                                                    marginTop: "12px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                },
                                                children: "Scansiona per validare",
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
            },
        },
        {
            width: 500,
            height: 650,
            fonts: [
                {
                    name: "Inter",
                    data: fontData,
                    weight: 400,
                    style: "normal",
                },
            ],
        }
    );

    const resvg = new Resvg(svg, {
        background: "#000000",
    });
    const pngData = resvg.render();
    return Buffer.from(pngData.asPng());
}
