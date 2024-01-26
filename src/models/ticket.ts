import type { Timestamp } from "firebase-admin/firestore"

export type Ticket = {
	ticketID: string,
	name: string,
	surname: string,
	checkIn: Timestamp,
	soldAt: Timestamp,
	seller: string
}