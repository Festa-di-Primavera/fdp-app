import { redirect } from '@sveltejs/kit';

import { hasPermission } from '$lib/utils';
import type { PageServerLoad } from "../$types";
import { UserPermissions } from '../../models/permissions';

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");
	
	if (!hasPermission(locals.user.permissions, UserPermissions.CHECK_OUT))
		redirect(302, "/");
	
	const currentDate = new Date();

	const startDate = new Date('2024-04-17T17:59:00');
	const endDate = new Date('2024-04-17T20:15:00');
	
	if(currentDate <= startDate && currentDate >= endDate)
		redirect(302, "/?checkOutExpired");
	
	return locals.user;
};