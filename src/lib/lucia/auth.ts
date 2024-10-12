import { dev } from "$app/environment";
import { Google } from "arctic";
import { Lucia, TimeSpan } from "lucia";

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "$env/static/private";
import { getClientDB } from "$lib/firebase/client";
import { FirestoreAdapter } from "./firestore-adapter";

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

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
        // session expires in 2 week
        sessionExpiresIn: new TimeSpan(
            2,
            "w"
        ),
        getUserAttributes: (attributes) => {
            return {
                // optional attributes from google
                google_id: attributes.google_id,
                avatar_url: attributes.avatar_url,

                // required attributes
                username: attributes.username,
                email: attributes.email,
                email_verified: attributes.email_verified,
                password_hash: attributes.password_hash,

                // custom attributes
                alias: attributes.alias,
                permissions: attributes.permissions,
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
    google_id?: string;
    avatar_url?: string;
    
    username: string;
    email: string;
    email_verified: boolean;
    password_hash?: string;

    alias: string;
    permissions: number;
    total_from_sales: number;
    owned_money: number;
}
