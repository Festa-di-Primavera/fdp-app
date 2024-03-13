import { getAuth } from 'firebase-admin/auth';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';

import { getAdminApp, getClaimsFromIdToken } from '$lib/firebase/admin';

import { fail, redirect } from '@sveltejs/kit';
import { doc, setDoc } from 'firebase/firestore';
import { getClientDB } from '$lib/firebase/client.js';

export async function load({ cookies }) {
	const app = getAuth(getAdminApp());

	const userClaims = await getClaimsFromIdToken(cookies);

	if (userClaims) {
		const user = await app.getUser(userClaims.uid);
		if (user?.customClaims?.accessLevel !== userClaims?.accessLevel) {
			return {
				logout: true
			};
		}
	}

	/* if (userClaims?.accessLevel >= Role.SUPERADMIN) { */
	if (
		userClaims?.email === import.meta.env.VITE_ADMIN_EMAIL1 ||
		userClaims?.email === import.meta.env.VITE_ADMIN_EMAIL2
	) {
		const tok = await app.createCustomToken(userClaims?.uid ?? '');

		return {
			token: tok
		};
	}

	throw redirect(302, '/');
}

export const actions = {
	default: async ({ cookies, request }) => {
		const formData = Object.fromEntries(await request.formData());

		if (
			!(formData.fileToUpload as File).name ||
			(formData.fileToUpload as File).name === 'undefined'
		) {
			return fail(400, {
				error: true,
				message: 'You must provide a file to upload'
			});
		}

		const app = getAuth(getAdminApp());
		const userClaims = await getClaimsFromIdToken(cookies);
		const tok = await app.createCustomToken(userClaims?.uid ?? "");

		await signInWithCustomToken(getClientAuth(), tok);

		const { fileToUpload } = formData as { fileToUpload: File };

		const fileContent = Buffer.from(await fileToUpload.arrayBuffer());

		const ticketsCodes = fileContent.toLocaleString().trim().split('\r\n');

		for (const code of ticketsCodes) {
			const ticketRef = doc(getClientDB(), "tickets", code);
			await setDoc(ticketRef, {
				name: null,
				surname: null,
				seller: null,
				soldAt: null,
				checkIn: null,
				newCheckIn: null,
				checkOut: null
			});
		}

		
		return {
			success: true
		};
	}
};
