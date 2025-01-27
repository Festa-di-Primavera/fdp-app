import type { User } from "$lib/auth/user";
import { writable, type Writable } from "svelte/store";

export const user: Writable<User | null> = writable(null);

export const theme: Writable<"light" | "dark"> = writable();
