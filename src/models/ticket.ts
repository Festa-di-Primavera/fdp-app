export type Ticket = {
    ticketId: string;
    name: string | null;
    surname: string | null;
    seller: string | null;
    soldAt: Date | null;
    checkIn: Date | null;
};
