import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from "../$types";
import { Role } from "../../models/role";
import { getClientDB } from '$lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { User } from 'lucia';

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if (locals.user.access_level < Role.ADMIN)
		redirect(302, "/");

	const usersCollection = collection(getClientDB(), "users");
	const qUsers = query(usersCollection, where("access_level", ">=", Role.SELLER));
	const qSnapUsers = await getDocs(qUsers);

	const sellers = qSnapUsers.docs.map((userDoc) => {
		return userDoc.data();
	}) as User[];

	return {
		user: locals.user,
		sellers
	};
};