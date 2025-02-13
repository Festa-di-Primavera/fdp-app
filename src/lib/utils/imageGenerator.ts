import QRCode from 'qrcode';
import sharp from 'sharp';
import { getFdPCode } from './tickets';

export async function generateTicketImage(name: string, surname: string, ticketId: string): Promise<Buffer> {
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(getFdPCode(ticketId!!)!!, {
        type: 'png',
        width: 300,
        margin: 1,
        errorCorrectionLevel: 'H'
    });

    // Create simple SVG text
    const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
		<svg width="500" height="600" xmlns="http://www.w3.org/2000/svg">
			<rect width="500" height="600" fill="#fce7d2"/>
			
			<!-- Intestazione -->
			<text 
				x="50%" 
				y="50" 
				font-family="monospace" 
				font-size="35" 
				font-weight="bold" 
				text-anchor="middle">
				Festa di Don Bosco
			</text>
			
			<!-- Nome e Cognome -->
			<text 
				x="50%" 
				y="150" 
				font-family="monospace" 
				font-size="30" 
				font-weight="bold" 
				text-anchor="middle">
				${name.toUpperCase()} ${surname.charAt(0).toUpperCase()}.
			</text>
			
			<!-- Ticket ID -->
			<text 
				x="50%" 
				y="200" 
				font-family="monospace" 
				font-size="25" 
				text-anchor="middle">
				${ticketId}
			</text>
		</svg>`;



    // Convert SVG to buffer
    const textLayer = Buffer.from(svg);

    // Compose the final image
    try {
        return await sharp({
            create: {
                width: 500,
                height: 600,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 }
            }
        })
        .composite([
            { 
                input: textLayer,
                top: 0,
                left: 0
            },
            {
                input: qrBuffer,
                top: 250,
				left: 100
            }
        ])
        .png()
        .toBuffer();
    } catch (error) {
        console.error('Error generating image:', error);
        throw error;
    }
}
