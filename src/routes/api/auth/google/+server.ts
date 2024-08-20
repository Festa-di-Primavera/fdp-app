// routes/login/google/+server.ts
import { redirect } from "@sveltejs/kit";
import { generateState } from "arctic";
import { google, googleCodeVerifier } from "$lib/lucia/auth";

import type { RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const scopes = ["openid", "profile", "email"];
	const url = await google.createAuthorizationURL(state, googleCodeVerifier, {scopes});

	event.cookies.set("google_oauth_state", state, {
		path: "/",
		secure: import.meta.env.PROD,
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	redirect(302, url.toString());
}