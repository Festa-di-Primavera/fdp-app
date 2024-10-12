import { getClientDB } from '$lib/firebase/client';
import { lucia } from '$lib/lucia/auth';
import { isSameAsOldPassword, verifyPasswordResetToken } from '$lib/auth/utils/password';
import { hash } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { collection, doc, runTransaction } from 'firebase/firestore';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ params }) => {
	const passwordResetToken = params.token;

	if (!passwordResetToken) {
		console.log('invalid token');
		fail(400, {
			error: true,
			message: 'Invalid password reset token'
		});
	}

	const { error, message } = await verifyPasswordResetToken(passwordResetToken);

	if (error) {
		console.log('error', message);
		fail(400, {
			error: true,
			message
		});
	}
};

export const actions = {
	passwordReset: async ({ request, locals }): Promise<{ error: boolean; message: string }> => {
		if (locals.user)
			return redirect(302, "/");

		const formData = await request.formData();
		const password = formData.get('password') as string;
		const passwordRepeat = formData.get('password_repeat') as string;
		const passwordResetToken = formData.get('token') as string;

		if (!password || !passwordRepeat) {
			console.log('password fields are required');
			return { error: true, message: 'Password fields are required' };
		}

		if (!passwordResetToken) {
			console.log('invalid token');
			return { error: true, message: 'Invalid password reset token' };
		}

		if (password !== passwordRepeat) {
			console.log('passwords do not match');
			return { error: true, message: 'Passwords do not match' };
		}

		const { error, userId, message } = await verifyPasswordResetToken(passwordResetToken);

		if (error) {
			console.log('error', message);
			return { error: true, message };
		}

		if (userId) {
			//check if password is equal to previous password
			if(await isSameAsOldPassword(userId, password)){
				console.log('Password is the same as the previous one');
				return { error: true, message: 'Password is the same as the previous one' };
			}

			const passwordHash = await hash(password, {
				// recommended minimum parameters
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});
			await lucia.invalidateUserSessions(userId);

			const db = getClientDB();
			const passwordResetTokensCollection = collection(db, 'password_reset_tokens');
			const userCollection = collection(db, 'users');

			await runTransaction(db, async (trx) => {
				trx.delete(doc(passwordResetTokensCollection, userId));
				trx.update(doc(userCollection, userId), {
					password_hash: passwordHash
				});
			});

			redirect(302, '/login');
		}

		return { error: false, message: 'Password reset successful' };
	}
};
