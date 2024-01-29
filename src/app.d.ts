// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	import type {DecodedIdToken} from 'firebase-admin/auth'
	namespace App {
		// interface Error {}
		interface Locals {
			// theme: Theme | null
			idToken: DecodedIdToken
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
