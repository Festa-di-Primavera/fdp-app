import type { PageServerLoad } from '../$types';
import { Role } from '../../models/role';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (locals.user.access_level < Role.ADMIN)
		redirect(302, "/");

	return locals.user;
};