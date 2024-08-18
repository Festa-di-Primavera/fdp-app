import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from "../$types";
import { Role } from "../../models/role";
import { getClientDB } from '$lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { User } from 'lucia';

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (locals.user.access_level < Role.ADMIN)
		redirect(302, "/");

	const users = collection(getClientDB(), "users");
	const qUsers = query(users, where("access_level", ">=", Role.SELLER));
	const qSnapUsers = await getDocs(qUsers);

	const sellers = qSnapUsers.docs.map((userDoc) => {
		return userDoc.data();
	}) as User[];

	return {
		user: locals.user,
		sellers
	};
};