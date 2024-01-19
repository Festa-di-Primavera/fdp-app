import type { Actions } from "./$types";

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get("name");
		const surname = formData.get("surname");
		const code = formData.get("code");
		console.log(name);
		console.log(surname);
		console.log(code);
	}
};