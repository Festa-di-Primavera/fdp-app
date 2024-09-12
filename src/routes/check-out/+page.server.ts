import { redirect } from '@sveltejs/kit';
import { Role } from '../../models/role';

import type { PageServerLoad } from "../$types";
import { getEnumValueFromString } from '$lib/utils';

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");
	
	if (getEnumValueFromString(Role, locals.user.role) != Role.CHECKOUT && getEnumValueFromString(Role, locals.user.role) < Role.ADMIN)
		redirect(302, "/");
	
	const currentDate = new Date();

	const startDate = new Date('2024-04-17T17:59:00');
	const endDate = new Date('2024-04-17T20:15:00');
	
	if(currentDate <= startDate && currentDate >= endDate)
		redirect(302, "/?checkOutExpired");
	
	return locals.user;
};