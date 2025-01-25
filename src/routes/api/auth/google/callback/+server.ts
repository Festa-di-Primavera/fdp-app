import { google } from "$lib/auth/google";
import {
    createSession,
    generateSessionToken,
    setSessionTokenCookie,
} from "$lib/auth/session";
import {
    createUserWithGoogle,
    type GoogleUser,
    type User,
} from "$lib/auth/user";
import { getClientDB } from "$lib/firebase/client";
import type { RequestEvent } from "@sveltejs/kit";
import { OAuth2RequestError } from "arctic";
import {
    collection,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
} from "firebase/firestore";

export async function GET(event: RequestEvent): Promise<Response> {
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("google_oauth_state") ?? null;
    const codeVerifier = event.cookies.get("google_code_verifier") ?? null;

    if (
        !code ||
        !state ||
        !storedState ||
        state !== storedState ||
        !codeVerifier
    ) {
        return new Response(null, {
            status: 400,
        });
    }

    try {
        const tokens = await google.validateAuthorizationCode(
            code,
            codeVerifier
        );
        const googleUserResponse = await fetch(
            "https://openidconnect.googleapis.com/v1/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${tokens.accessToken()}`,
                },
            }
        );

        const googleUser: GoogleUser = await googleUserResponse.json();

        const usersCollection = collection(getClientDB(), "users");

        const googleQuery = query(
            usersCollection,
            where("google_id", "==", googleUser.sub)
        );
        const googleQuerySnap = await getDocs(googleQuery);
        const existingGoogleUser = googleQuerySnap.docs[0]?.data() as User;

        // check if google user exists
        if (existingGoogleUser) {
            const token = generateSessionToken();
            const session = await createSession(token, existingGoogleUser.id);
            setSessionTokenCookie(event, token, session.expiresAt);
        } else {
            // check if the user already registered with that email
            const emailQuery = query(
                usersCollection,
                where("email", "==", googleUser.email)
            );
            const emailQuerySnap = await getDocs(emailQuery);
            const existingEmailUser = emailQuerySnap.docs[0]?.data() as User;

            if (existingEmailUser) {
                await updateDoc(doc(usersCollection, existingEmailUser.id), {
                    email_verified: googleUser.email_verified,
                    google_id: googleUser.sub,
                    avatar_url: googleUser.picture,
                });

                const token = generateSessionToken();
                const session = await createSession(
                    token,
                    existingEmailUser.id
                );
                setSessionTokenCookie(event, token, session.expiresAt);
            } else {
                const user = await createUserWithGoogle(googleUser);

                const token = generateSessionToken();
                const session = await createSession(token, user.id);
                setSessionTokenCookie(event, token, session.expiresAt);
            }
        }
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
            },
        });
    } catch (e) {
        console.error(e);
        // the specific error message depends on the provider
        if (e instanceof OAuth2RequestError) {
            // invalid code
            return new Response(null, {
                status: 400,
            });
        }
        return new Response(null, {
            status: 500,
        });
    }
}
