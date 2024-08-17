// routes/login/google/callback/+server.ts
import { firestoreDb, google, googleCodeVerifier, lucia } from "$lib/lucia/auth";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize, type User } from "lucia";

import type { RequestEvent } from "@sveltejs/kit";
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("google_oauth_state") ?? null;

	if (!code || !state || !storedState || state !== storedState) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, googleCodeVerifier);
		const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const googleUser: GoogleUser = await googleUserResponse.json();

		const userTable = collection(firestoreDb, "users");
		const q = query(userTable, where("google_id", "==", googleUser.sub));
		const qSnap = await getDocs(q);
		const existingUser = qSnap.docs[0]?.data() as User;

		if (existingUser) {
			const session = await lucia.createSession(existingUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		} else {
			const userId = generateIdFromEntropySize(10); // 16 characters long
			const newUser = {
				id: userId,
				google_id: googleUser.sub,
				username: googleUser.name,
				avatar_url: googleUser.picture,
				email: googleUser.email,
				email_verified: googleUser.email_verified,
				alias: googleUser.name,
				access_level: 100,
				role: 'superadmin',
				total_from_sales: 100,
				owned_money: 100,
			} as User;

			await setDoc(doc(userTable, userId),newUser);

			const session = await lucia.createSession(userId, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		}
		return new Response(null, {
			status: 302,
			headers: {
				Location: "/"
			}
		});
	} catch (e) {
		console.error(e);
		// the specific error message depends on the provider
		if (e instanceof OAuth2RequestError) {
			// invalid code
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}

interface GoogleUser {
	sub: string;
	name: string;
	picture: string;
	email: string;
	email_verified: boolean;
}