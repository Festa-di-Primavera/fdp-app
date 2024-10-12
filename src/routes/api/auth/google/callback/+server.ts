// routes/login/google/callback/+server.ts
import { firestoreDb, google, lucia } from "$lib/lucia/auth";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize, type User } from "lucia";

import type { RequestEvent } from "@sveltejs/kit";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("google_oauth_state") ?? null;
	const codeVerifier = event.cookies.get("google_code_verifier") ?? null;

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const googleUserResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.accessToken}`
			}
		});

		const googleUser: GoogleUser = await googleUserResponse.json();

		const usersCollection = collection(firestoreDb, "users");

		const googleQuery = query(usersCollection, where("google_id", "==", googleUser.sub));
		const googleQuerySnap = await getDocs(googleQuery);
		const existingGoogleUser = googleQuerySnap.docs[0]?.data() as User;
		
		// check if google user exists
		if (existingGoogleUser) {
			const session = await lucia.createSession(existingGoogleUser.id, {});
			const sessionCookie = lucia.createSessionCookie(session.id);
			event.cookies.set(sessionCookie.name, sessionCookie.value, {
				path: ".",
				...sessionCookie.attributes
			});
		} else {
			// check if the user already registered with that email
			const emailQuery = query(usersCollection, where("email", "==", googleUser.email));
			const emailQuerySnap = await getDocs(emailQuery);
			const existingEmailUser = emailQuerySnap.docs[0]?.data() as User;

			if(existingEmailUser){
				await updateDoc(doc(usersCollection, existingEmailUser.id), {
						email_verified: googleUser.email_verified,
						google_id: googleUser.sub,
						avatar_url: googleUser.picture
					}
				)

				const session = await lucia.createSession(existingEmailUser.id, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: ".",
					...sessionCookie.attributes
				});
			}
			else{
				const userId = generateIdFromEntropySize(10); // 16 characters long
				const newUser = {
					id: userId,
					google_id: googleUser.sub,
					username: googleUser.name,
					avatar_url: googleUser.picture,
					email: googleUser.email,
					email_verified: googleUser.email_verified,
					alias: googleUser.name,
					permissions: 0,
					total_from_sales: 0,
					owned_money: 0,
				} as User;
	
				await setDoc(doc(usersCollection, userId),newUser);
	
				const session = await lucia.createSession(userId, {});
				const sessionCookie = lucia.createSessionCookie(session.id);
				event.cookies.set(sessionCookie.name, sessionCookie.value, {
					path: ".",
					...sessionCookie.attributes
				});
			}
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