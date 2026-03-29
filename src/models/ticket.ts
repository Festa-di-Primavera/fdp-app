import type { User } from "$lib/auth/user";

export type Ticket = {
    ticketId: string;
    fiscalMatrixNumber: string;
    name: string | null;
    surname: string | null;
    seller: string | null;
    soldAt: Date | null;
    checkIn: Date | null;
};

export type Block = {
    id: string;
    assigned_to: User | null;
    assigned_by: User | null;
    assigned_at: Date | null;
};
