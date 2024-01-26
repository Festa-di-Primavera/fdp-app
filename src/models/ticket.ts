export type Ticket = {
	ticketID: string,
	name: string | null,
	surname: string | null,
	checkIn: Date |null,
	soldAt: Date | null,
	seller: string | null
}