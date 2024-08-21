import type { PageServerLoad } from "../$types";
import { Role } from "../../models/role";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if (locals.user.access_level < Role.CHECKOUT)
		redirect(302, "/");

	return locals.user;
};