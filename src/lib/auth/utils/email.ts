import { getClientDB } from '$lib/firebase/client';
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	setDoc,
	Timestamp,
	updateDoc
} from 'firebase/firestore';
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { sendEmail } from './resend';

export function isValidEmail(email: string): boolean {
	return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/// Generate a random 6-digit code and store it in the database
export async function generateEmailVerificationCode(
	userId: string,
	email: string
): Promise<string> {
	const codesCollection = collection(getClientDB(), 'email_verification_codes');
	await deleteDoc(doc(codesCollection, userId));

	const code = generateRandomString(6, alphabet('0-9', 'A-Z'));
	await setDoc(doc(codesCollection, userId), {
		email,
		code,
		expires_at: createDate(new TimeSpan(15, 'm'))
	});
	return code;
}

/// Send an email with the verification code to the user using resend
export async function sendVerificationCode(
	email: string,
	code: string
): Promise<{ error: boolean; message: string }> {
	return await sendEmail(
		email,
		'Codice di Verifica Email',
		`
			<!DOCTYPE html>
			<html lang="it" style="margin: 0; padding: 0;">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Codice di Verifica Email</title>
			</head>
			<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333;">
				<div style="background-color: #ffffff; margin: 50px auto; padding: 20px; max-width: 600px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
					<div style="text-align: center; background-color: #CD42D3; padding: 20px 0; border-radius: 10px 10px 0 0;">
						<img src="https://i.ibb.co/vJ1qSG5/email-logo.png" alt="email-logo" border="0" height="75rem"></a>
					</div>
					<div style="padding: 30px; text-align: center;">
						<h2 style="font-size: 24px; color: #333; margin-bottom: 20px;">Benvenuto nell'app della Festa di Primavera!</h2>
						<p>Per completare la procedura, è necessario verificare il tuo indirizzo email.</p>
						<p>Il tuo codice di verifica è:</p>
						<div style="text-align: center; margin: 20px 0;">
							<div style="font-size: 28px; font-weight: bold; color: #CD42D3; background-color: #f9f9f9; padding: 15px; border: 2px dashed #CD42D3; letter-spacing: 5px; display: inline-block; margin-bottom: 10px;">${code}</div>
						</div>
						<p>Inserisci questo codice nella pagina di verifica per attivare il tuo account.</p>
						<p>Se non hai richiesto questo codice, ti preghiamo di ignorare questa email e/o di contattare i responsabili.</p>
					</div>
				</div>
			</body>
			</html>
		`
	);
}

/// Verify the email verification code and update the user's email_verified field
export const verifyEmailVerificationCode = async (userId: string, code: string) => {
	const usersCollection = collection(getClientDB(), 'users');

	const codesCollection = collection(getClientDB(), 'email_verification_codes');
	const codeDoc = (await getDoc(doc(codesCollection, userId))).data() as CodeDoc;

	const { code: verificationCode, expires_at } = codeDoc;

	// If there's no verification code for the user in the database
	if (!verificationCode) {
		return { error: true, message: 'Verification code not found.' };
	}

	// If the provided code doesn't match the one in the database
	if (verificationCode !== code) {
		return { error: true, message: 'The provided verification code is incorrect.' };
	}

	// If the verification code has expired
	if (!isWithinExpirationDate(expires_at.toDate())) {
		return {
			error: true,
			message: 'The verification code has expired, please request a new one.'
		};
	}

	// If everything is okay, delete the verification code from the database
	await deleteDoc(doc(codesCollection, userId));
	await updateDoc(doc(usersCollection, userId), {
		email_verified: true
	});

	// Return a success message
	return { error: false, message: 'Email verification successful!' };
};

interface CodeDoc {
	email: string;
	code: string;
	expires_at: Timestamp;
}
