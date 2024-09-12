import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { Role } from "../../models/role";
import { getEnumValueFromString } from "$lib/utils";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if (getEnumValueFromString(Role, locals.user.role) < Role.SELLER)
		redirect(302, "/");

	return locals.user;
};