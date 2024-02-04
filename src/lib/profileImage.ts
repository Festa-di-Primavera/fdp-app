import { createCanvas } from "canvas";

export function createProfileImage(name: string, color: string) {
	const dimensions = 200;
	const fontSize = dimensions/1.75;

	const letter = name.charAt(0).toUpperCase();
	const canvas = createCanvas(dimensions, dimensions);
	const ctx = canvas.getContext('2d');
	
	
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, dimensions, dimensions);
	
	ctx.fillStyle = '#fff';
	ctx.font = `bold ${fontSize}px Arial, sans-serif`;
	const textWidth = ctx.measureText(letter).width;
	ctx.fillText(letter, (dimensions - textWidth) / 2, dimensions / 2 + fontSize / 3);

	return `${canvas.toDataURL()}`;
}