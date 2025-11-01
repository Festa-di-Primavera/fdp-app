import { GOOGLE_OAUTH_CLIENT } from "$lib/auth/google";
import type { RequestEvent } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { generateCodeVerifier, generateState } from "arctic";

export async function handleRequest(event: RequestEvent): Promise<Response> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = GOOGLE_OAUTH_CLIENT.createAuthorizationURL(
        state,
        codeVerifier,
        ["openid", "profile", "email"]
    );

    event.cookies.set("google_oauth_state", state, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax",
    });
    event.cookies.set("google_code_verifier", codeVerifier, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 10, // 10 minutes
        sameSite: "lax",
    });

    redirect(302, url.toString());
}
