import { getClientDB } from '$lib/firebase/client.js';
import { fail, redirect } from '@sveltejs/kit';
import { doc, setDoc } from 'firebase/firestore';
import type { PageServerLoad } from '../$types';
import { hasPermission } from '$lib/utils';
import { UserPermissions } from '../../models/permissions';


export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if (!hasPermission(locals.user.permissions, UserPermissions.GENERATE))
		redirect(302, "/");

	return locals.user;
};

export const actions = {
	default: async ({ request }) => {
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
