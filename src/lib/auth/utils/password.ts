import { getClientDB } from '$lib/firebase/client';
import { hash, verify } from '@node-rs/argon2';
import { collection, doc, getDoc, getDocs, query, runTransaction, Timestamp, where } from 'firebase/firestore';
import { createDate, isWithinExpirationDate } from 'oslo';
import { sendEmail } from './resend';
import { TimeSpan } from './timespan';
import { encodeBase32LowerCaseNoPadding } from '@oslojs/encoding';
import { encodeHex } from 'oslo/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import type { User } from '../user';

interface PasswordResetToken {
	user_id: string;
	token_hash: string;
	expires_at: Timestamp;
}

export async function hashPassword(password: string): Promise<string> {
	return await hash(password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
}

export async function verifyPasswordHash(hash: string, password: string): Promise<boolean> {
	return await verify(hash, password);
}

const generateRandomToken = () => {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
};

/// Generate a random token and store it in the database
export const generatePasswordResetToken = async (userId: string) => {
	const tokenId = generateRandomToken();
	const tokenHash = encodeHex(sha256(new TextEncoder().encode(tokenId)));

	const db = getClientDB();
	const passwordResetTokensCollection = collection(db, 'password_reset_tokens');

	await runTransaction(db, async (trx) => {
		trx.delete(doc(passwordResetTokensCollection, userId));
		trx.set(doc(passwordResetTokensCollection, userId), {
			token_hash: tokenHash,
			user_id: userId,
			expires_at: createDate(new TimeSpan(15, 'm')) // 15 minutes
		});
	});

	return tokenId;
};

/// Verify the token and return the user id
export const verifyPasswordResetToken = async (tokenId: string) => {
	const passwordResetTokensCollection = collection(getClientDB(), 'password_reset_tokens');
	const passwordResetQuery = query(passwordResetTokensCollection, where('token_hash', '==', encodeHex(sha256(new TextEncoder().encode(tokenId)))));
	const passwordResetTokenDoc = (await getDocs(passwordResetQuery)).docs[0]?.data() as PasswordResetToken;

	if (!passwordResetTokenDoc) {
		return {
			error: true,
			message: 'Il link di reset password non è valido! Per favore richiedi un nuovo link'
		};
	}

	if (!isWithinExpirationDate(passwordResetTokenDoc.expires_at.toDate())) {
		return {
			error: true,
			message: 'Il link di reset password è scaduto! Per favore richiedi un nuovo link'
		};
	}

	return {
		error: false,
		userId: passwordResetTokenDoc.user_id,
		message: 'Token di reset password valido'
	};
};

/// Send an email with the reset link to the user using resend
export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
	const htmlContent = `
		<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
			<h1>Richiesta di reset password</h1>
			<p>Abbiamo ricevuto una richiesta di reset della tua password. Se non hai fatto tu questa richiesta, ignora questa email. Altrimenti, puoi resettare la tua password usando il link qui sotto.</p>

			<p>
			<a href="https://festa-cus.it/login/password-reset/${resetToken}" style="color: #337ab7; text-decoration: none;">Resetta la tua password</a>
			</p>

			<p>Se hai bisogno di aiuto o hai domande, contatta il nostro team di supporto. Siamo qui per aiutarti!</p>
		</div>
	`;

	return await sendEmail(email, 'Richiesta di Reset Password', htmlContent);
};

/// Check if the new password is the same as the old password
export const isSameAsOldPassword = async (userId: string, newPassword: string) => {
	const usersCollection = collection(getClientDB(), 'users');
	const userDoc = (await getDoc(doc(usersCollection, userId))).data() as User;

	// If user doesn't exist, return false
	if (!userDoc) {
		return false;
	}

	// Verify the old password
	let isSamePassword = undefined;
	if (userDoc.password_hash) {
		isSamePassword = await verify(userDoc.password_hash, newPassword);
	}

	return isSamePassword;
};
