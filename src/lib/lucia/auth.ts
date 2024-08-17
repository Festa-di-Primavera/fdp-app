import { dev } from "$app/environment";
import { generateCodeVerifier, Google } from "arctic";
import dotenv from "dotenv";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { Lucia } from "lucia";
import { resolve } from "path";

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "$env/static/private";
import { FirestoreAdapter } from "./firestore-adapter";

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, "http://localhost:5173/login/google/callback");
export const googleCodeVerifier = generateCodeVerifier();

dotenv.config({ path: `${resolve()}/.env` });

const clientConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
};

export const getClientApp = (): FirebaseApp => {
    if (getApps().length > 0) {
        return getApp();
    }
    
    // Inizializzazione condizionale solo lato server
    if (typeof window === "undefined") {
        const app = initializeApp(clientConfig);
        return app;
    }

    throw new Error("Firebase initialization failed: Invalid environment");
};
export const firestoreDb = getFirestore(getClientApp());

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
                googleId: attributes.google_id,
                username: attributes.username,
                avatarUrl: attributes.avatar_url,
                email: attributes.email ?? null
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
    google_id: number;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
}
