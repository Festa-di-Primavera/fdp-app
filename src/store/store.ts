import type { User } from 'lucia';
import { writable, type Writable } from 'svelte/store';

export const user: Writable<User | null> = writable(null);

export const theme: Writable<'light' | 'dark'> = writable();