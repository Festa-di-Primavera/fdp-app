export type Ticket = {
	ticketID: string;
	name: string | null;
	surname: string | null;
	seller: string | null;
	soldAt: Date | null;
	checkIn: Date |null;
	checkOut: Date | null;
	newCheckIn: Date | null;
}