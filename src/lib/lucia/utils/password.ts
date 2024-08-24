import { getClientDB } from "$lib/firebase/client";
import { collection, doc, getDoc, runTransaction, Timestamp } from "firebase/firestore";
import { generateId, TimeSpan, type User } from "lucia";
import { createDate, isWithinExpirationDate } from "oslo";
import { sendEmail } from "./resend";
import { verify } from "@node-rs/argon2";

interface PasswordResetToken {
	user_id: string;
	expires_at: Timestamp;
}

export const generatePasswordResetToken = async (userId: string) => {
	const tokenId = generateId(40);

	const db = getClientDB();
	const passwordResetTokensCollection = collection(db, 'password_reset_tokens');

	await runTransaction(db, async (trx) => {
		trx.delete(doc(passwordResetTokensCollection, userId));
		trx.set(doc(passwordResetTokensCollection, tokenId), {
			user_id: userId,
			expires_at: createDate(new TimeSpan(15, 'm')) // 15 minutes
		});
	});

	return tokenId;
};

export const verifyPasswordResetToken = async (tokenId: string) => {
	const passwordResetTokensCollection = collection(getClientDB(), 'password_reset_tokens');
	const passwordResetTokenDoc = (await getDoc(doc(passwordResetTokensCollection, tokenId))).data() as PasswordResetToken;


	if (!passwordResetTokenDoc) {
		return {
			error: true,
			message: 'The password reset link is invalid. Please request a new one.'
		};
	}

	if (!isWithinExpirationDate(passwordResetTokenDoc.expires_at.toDate())) {
		return {
			error: true,
			message: 'The password reset link has expired. Please request a new one.'
		};
	}

	return {
		error: false,
		userId: passwordResetTokenDoc.user_id,
		message: 'Password reset token is valid.'
	};
};

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

	return await sendEmail(
		email,
		'Richiesta di Reset Password',
		htmlContent
	);
};

export const isSameAsOldPassword = async (userId: string, newPassword: string) => {
	const usersCollection = collection(getClientDB(), 'users');
	const userDoc = (await getDoc(doc(usersCollection, userId))).data() as User;


	// If user doesn't exist, return false
	if (!userDoc) {
		return false;
	}

	// Verify the old password
	let isSamePassword = undefined;
	if(userDoc.password_hash) {
		isSamePassword = await verify(userDoc.password_hash, newPassword);
	}

	return isSamePassword;
};