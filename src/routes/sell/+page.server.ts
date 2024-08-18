import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { Role } from "../../models/role";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (locals.user.access_level < Role.SELLER)
		redirect(302, "/");

	return locals.user;
};