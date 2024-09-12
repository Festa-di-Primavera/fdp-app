import { getClientDB } from '$lib/firebase/client';
import { lucia } from '$lib/lucia/auth';
import { generateEmailVerificationCode, isValidEmail, sendVerificationCode } from '$lib/lucia/utils/email';
import { hash, verify } from '@node-rs/argon2';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { collection, deleteDoc, doc, getDocs, or, query, setDoc, where } from 'firebase/firestore';
import { generateIdFromEntropySize } from 'lucia';
import type { PageServerLoad } from '../$types';
import { getStringFromEnumValue } from '$lib/utils';
import { Role } from '../../models/role';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		if (!locals.user.email_verified)
			redirect(302, "/login/verify-email");
		else
			redirect(302, '/');
	}
};

export const actions: Actions = {
	signup: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const passwordRepeat = formData.get('password_repeat');
		const email = formData.get('email');

		if (typeof password !== 'string' ||
			password.length < 8 || 										// minimum 8 characters
			!/[A-Z]/.test(password) || 									// at least one uppercase letter
			!/[0-9]/.test(password) || 									// at least one number
			!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)		// at least one special character
		) {
			return fail(400, {
				error: true,
				message: 'Invalid password'
			});
		}
		if (password !== passwordRepeat) {
			return fail(400, {
				error: true,
				message: 'Passwords do not match'
			});
		}
		if (typeof email !== 'string' || !isValidEmail(email)) {
			return fail(400, {
				error: true,
				message: 'Invalid email'
			});
		}
		
		// Check if email or username already exists
		const usersCollection = collection(getClientDB(), 'users');
		const userQuery = query(usersCollection, or(where('email', '==', email), where('username', '==', username)));
		const existingUsers = (await getDocs(userQuery)).docs;

		const equalEmail = existingUsers.find(u => u.data().email === email);
		if (equalEmail) {
			return fail(400, {
				error: true,
				message: 'Email già in uso'
			});
		}

		const equalUsername = existingUsers.find(u => u.data().username === username);
		if (equalUsername) {
			return fail(400, {
				error: true,
				message: 'Username già in uso'
			});
		}

		// Create user
		const userId = generateIdFromEntropySize(10); // 16 characters long
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		await setDoc(doc(usersCollection, userId), {
			id: userId,

			username: username,
			email: email,
			email_verified: false,
			password_hash: passwordHash,

			alias: username,
			role: getStringFromEnumValue(Role, Role.UNVERIFIED),
			owned_money: 0,
			total_from_sales: 0
		});

		// Send verification email
		const verificationCode = await generateEmailVerificationCode(userId, email);
		await sendVerificationCode(email, verificationCode);

		// Create session
		const session = await lucia.createSession(userId, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

		redirect(302, '/');
	},
	signin: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email');
		const isUsername = (email as string)?.includes('@') ? false : true;
		const password = formData.get('password');

		const usersCollection = collection(getClientDB(), 'users');
		const q = query(usersCollection, where(isUsername ? 'username' : 'email', '==', (email as string)));
		const existingUser = (await getDocs(q)).docs[0]?.data();

		if(!existingUser) {
			return fail(400, {
				error: true,
				message: 'Utente e password non corretti'
			});
		}
		
		if(!existingUser.password_hash) {
			return fail(400, {
				error: true,
				message: 'Utente registrato con Google\nRegistrati con email e password oppure accedi con Google'
			});
		}

		const validPassword = await verify(existingUser.password_hash, (password as string), {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return fail(400, {
				error: true,
				message: "Utente e password non corretti"
			});
		}

		const session = await lucia.createSession(existingUser.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		if(existingUser.email_verified)
			redirect(302, "/");
		else
			redirect(302, "/login/verify-email");
	},
	delete: async (event) => {
		console.log('deleteAccount');

		if (!event.locals.user) {
			return fail(400, {
				error: true,
				message: 'Utente non autenticato'
			});
		}

		const userId = event.locals.user.id;
		const usersCollection = collection(getClientDB(), 'users');
		await deleteDoc(doc(usersCollection, userId));

		lucia.invalidateUserSessions(userId);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: ".",
			...sessionCookie.attributes
		});

		redirect(302, "/login");
	}
};
