//import type { ListUsersResult } from "firebase-admin/auth";
import { goto } from '$app/navigation';
import { getAuth, signOut, type User } from 'firebase/auth';
import { writable, type Writable } from 'svelte/store';

export const user: Writable<User | null> = writable(null);

export const handleSignOut = async () => {
	try {
		await signOut(getAuth());
		await fetch('/api/session', {
			method: 'DELETE'
		});

		user.set(null);

		goto('/');
	} catch (error) {
		console.error(error);
	}
};