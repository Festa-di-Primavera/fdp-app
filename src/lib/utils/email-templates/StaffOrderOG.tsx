import { ItemType, type Order, BaseIngredient } from "../../../models/order";
import React from 'react';

interface StaffOrderOGProps {
	order: Order;
	qrCodeBase64: string;
	logoBase64: string;
}

function getIngredientsList(type: ItemType): string {
	switch (type) {
		case ItemType.ONTO:
			return "Pane, hamburger, formaggio, cipolla, peperoni, insalata";
		case ItemType.VEGETARIANO:
			return "Pane, formaggio, cipolla, peperoni, insalata";
		case ItemType.BASIC:
			return "Pane, hamburger, formaggio";
		default:
			return "ERRORE NEL RECUPERO DEGLI INGREDIENTI";
	}
}

export default function StaffOrderOG({ order, qrCodeBase64, logoBase64 }: StaffOrderOGProps) {
	const item = order.items[0];

	return (
		<div
			style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f5f5f5',
				padding: '40px',
			}}
		>
			<div
				style={{
					backgroundColor: '#000000',
					borderRadius: '12px',
					padding: '40px',
					width: '600px',
					display: 'flex',
					flexDirection: 'column',
					boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
				}}
			>
				{/* Logo */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						marginBottom: '30px',
					}}
				>
					<img
						src={logoBase64}
						alt="Logo"
						width={200}
						height={100}
						style={{
							borderRadius: '8px',
						}}
					/>
				</div>

				{/* User Info */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						padding: '30px 0',
						marginBottom: '30px',
						borderTop: '1px solid #3DDC84',
						borderBottom: '1px solid #3DDC84',
					}}
				>
					<span
						style={{
							fontSize: '28px',
							color: '#ffffff',
							fontWeight: 600,
							letterSpacing: '0.5px',
							textAlign: 'center',
						}}
					>
						{order.name} {order.surname}
					</span>
				</div>

				{/* Ticket Code */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						marginBottom: '30px',
					}}
				>
					<span
						style={{
							fontSize: '14px',
							color: '#3DDC84',
							marginBottom: '8px',
							textTransform: 'uppercase',
							letterSpacing: '1px',
						}}
					>
						Codice Biglietto
					</span>
					<span
						style={{
							fontSize: '24px',
							color: '#ffffff',
							fontWeight: 600,
							fontFamily: 'monospace',
							letterSpacing: '2px',
						}}
					>
						{order.ticketId}
					</span>
				</div>

				{/* QR Code */}
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						marginBottom: '30px',
					}}
				>
					<img
						src={qrCodeBase64}
						alt="QR Code"
						width={200}
						height={200}
						style={{
							borderRadius: '4px',
							backgroundColor: '#e0e0e0',
						}}
					/>
					<span
						style={{
							color: '#999',
							fontSize: '12px',
							marginTop: '12px',
							textTransform: 'uppercase',
							letterSpacing: '0.5px',
						}}
					>
						Scansiona per validare
					</span>
				</div>
			</div>
		</div>
	);
}
