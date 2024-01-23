import { initAdmin } from '$lib/firebase/firebaseAdmin';
// import { get } from 'svelte/store';
// import { usersList } from '../../store/store';
// import { json } from '@sveltejs/kit';

export async function load() {
	const app = initAdmin();
	
	/* app.auth().setCustomUserClaims('muN6kuI7v6aUSbyV8qYkWCGFcgq1', { role: "seller", accessLevel: 10 });
	(await app.auth().listUsers()).users.forEach(
		user => {
			if (user.customClaims && user.customClaims.role === 'seller') {
				console.log(user.displayName, user.customClaims);
			}
		}
	); */

	// if(get(usersList) === null){
	// 	usersList.set(await app.auth().listUsers());
	// 	console.log(get(usersList));
	// }

	/* console.log(get(usersList)); */
	return {
		usersList: JSON.stringify(await app.auth().listUsers())
	}

}