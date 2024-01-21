import { goto } from "$app/navigation";
import { getAuth, signOut, type User } from "firebase/auth";
import { writable, type Writable } from "svelte/store";

export const user: Writable<User | null> = writable(null);

export const handleSignOut = async () => {
	try {
	  await signOut(getAuth());
	  goto("/");
	} catch (error) {
	  console.error(error);
	}
  }