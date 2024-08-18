import { dev } from "$app/environment";
import { generateCodeVerifier, Google } from "arctic";
import dotenv from "dotenv";
import { Lucia } from "lucia";
import { resolve } from "path";

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
import { getClientDB } from "$lib/firebase/client";
import { FirestoreAdapter } from "./firestore-adapter";

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "http://localhost:5173/api/login/google/callback");
export const googleCodeVerifier = generateCodeVerifier();

dotenv.config({ path: `${resolve()}/.env` });

export const firestoreDb = getClientDB();

export const lucia = new Lucia(
    new FirestoreAdapter(firestoreDb, {
        user: "users",
        session: "sessions",
    }),
    {
        sessionCookie: {
            attributes: {
                secure: !dev,
            },
        },
        getUserAttributes: (attributes) => {
            return {
                google_id: attributes.google_id,
                username: attributes.username,
                avatar_url: attributes.avatar_url,
                email: attributes.email ?? null,
                email_verified: attributes.email_verified,
                alias: attributes.alias,
                access_level: attributes.access_level,
                role: attributes.role,
                total_from_sales: attributes.total_from_sales,
                owned_money: attributes.owned_money,
            };
        },
    }
);

declare module "lucia" {
    interface Register {
        Lucia: typeof lucia;
        DatabaseUserAttributes: DatabaseUserAttributes;
    }
}

interface DatabaseUserAttributes {
    google_id: string;
    username: string;
    avatar_url: string | null;
    email: string;
    email_verified: boolean;
    alias: string;
    access_level: number;
    role: string;
    total_from_sales: number;
    owned_money: number;
}
