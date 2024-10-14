import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getClientDB } from '$lib/firebase/client';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { hasPermission } from '$lib/utils/permissions';
import { UserPermissions } from '$models/permissions';
import type { User } from '$lib/auth/user';
import type { Block } from '$lib/utils/tickets';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/login');

	if (!locals.user.email_verified) redirect(302, '/login/verify-email');

	if (!hasPermission(locals.user.permissions, UserPermissions.UTENTI)) {
		redirect(302, '/');
	}

	const usersCollection = collection(getClientDB(), 'users');
	const qUsers = query(usersCollection, where('permissions', '>=', UserPermissions.VENDITA));

	const users = (await getDocs(qUsers)).docs.map((userDoc) => {
		return userDoc.data();
	}) as User[];
	const sellers = users.filter((user) => hasPermission(user.permissions, UserPermissions.VENDITA));

	const blocksCollection = collection(getClientDB(), 'blocks');
	const blocks = await getDocs(blocksCollection);
	const blockList = blocks.docs.map((blockDoc) => {
		const data = blockDoc.data();
		return {
			id: blockDoc.id,
			assigned_to: users.find((seller) => seller.id === data.assigned_to),
			assigned_by: users.find((user) => user.id === data.assigned_by),
			assigned_at: data.assigned_at?.toDate()
		} as Block;
	}) as Block[];

	return {
		user: locals.user,
		sellers,
		blockList
	};
};
