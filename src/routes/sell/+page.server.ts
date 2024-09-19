import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "../$types";
import { UserPermissions } from "../../models/permissions";
import { hasPermission } from "$lib/utils";

export const load: PageServerLoad = async ({locals}) => {
	if (!locals.user)
		redirect(302, "/login");

	if (!locals.user.email_verified)
		redirect(302, "/login/verify-email");

	if (!hasPermission(locals.user.permissions, UserPermissions.VENDITA))
		redirect(302, "/");

	return locals.user;
};