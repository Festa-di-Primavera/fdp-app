import { dev } from "$app/environment";
import { collection } from "firebase/firestore";
import { getClientDB } from "./client";

/* AUTH */
export const SESSIONS = collection(getClientDB(), "sessions");
export const USERS = collection(getClientDB(), "users");

export const EMAIL_VERIFICATION_CODES = collection(
    getClientDB(),
    "email_verification_codes"
);
export const PASSWORD_RESET_TOKENS = collection(
    getClientDB(),
    "password_reset_tokens"
);

/* APP */
export const TICKETS = collection(
    getClientDB(),
    dev ? "ticketsDEV" : "tickets"
);
export const BLOCKS = collection(getClientDB(), dev ? "blocksDEV" : "blocks");
export const ORDERS = collection(getClientDB(), dev ? "ordersDEV" : "orders");
