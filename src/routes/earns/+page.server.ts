import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClientDB } from '$lib/firebase/client';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { hasPermission } from '$lib/utils/permissions';
import { UserPermissions } from '$models/permissions';
import type { User } from '$lib/auth/user';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	if (!locals.user.email_verified) redirect(302, '/login/verify-email');

	if (!hasPermission(locals.user.permissions, UserPermissions.UTENTI)) {
		redirect(302, '/');
	}

	const usersCollection = collection(getClientDB(), 'users');
	const qUsers = query(usersCollection, where('permissions', '>=', UserPermissions.VENDITA));
	const qSnapUsers = await getDocs(qUsers);

	const sellers = (
		qSnapUsers.docs.map((userDoc) => {
			return userDoc.data();
		}) as User[]
	)
		.filter((user) => hasPermission(user.permissions, UserPermissions.VENDITA))
		.sort((a, b) => b.total_from_sales - a.total_from_sales);

	return {
		user: locals.user,
		sellers: sellers
	};
};
