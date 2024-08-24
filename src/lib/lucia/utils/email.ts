import { getClientDB } from '$lib/firebase/client';
import { collection, deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { createDate, isWithinExpirationDate, TimeSpan } from 'oslo';
import { alphabet, generateRandomString } from 'oslo/crypto';
import { sendEmail } from './resend';


export function isValidEmail(email: string): boolean {
	return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export async function generateEmailVerificationCode(
	userId: string,
	email: string
): Promise<string> {
	const codesCollection = collection(getClientDB(), 'email_verification_code');
	await deleteDoc(doc(codesCollection, userId));

	const code = generateRandomString(6, alphabet('0-9', 'A-Z'));
	await setDoc(doc(codesCollection, userId), {
		email,
		code,
		expires_at: createDate(new TimeSpan(15, 'm'))
	});
	return code;
}

export async function sendVerificationCode(
	email: string,
	code: string
): Promise<{ error: boolean; message: string }> {
	return await sendEmail(
		email, 
		'Codice di Verifica Email', 
		`
			<p>Ciao!</p>
			<p>Il tuo codice di verifica email è:<br/>
				<strong style="
					font-family: 'JetBrains Mono', monospace;
					font-size: 20px;
					padding: 5px 10px;
					background-color: #f0f0f0;
					color: #333;
					border-radius: 5px;
					letter-spacing: 4px;
				">
					${code}
				</strong>
			</p>
			<p>Se non hai richiesto questo codice, ignora questa email.</p>

			<p>Baci e ossequi,<br/>Il Team FDP</p>
		`
	)
}

export const verifyEmailVerificationCode = async (userId: string, code: string) => {
	const usersCollection = collection(getClientDB(), 'users');
	
	const codesCollection = collection(getClientDB(), 'email_verification_code');
	const codeDoc = (await getDoc(doc(codesCollection, userId))).data() as CodeDoc;

	const { code: verificationCode, expires_at } = codeDoc

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
	await updateDoc(doc(usersCollection, userId),{
		email_verified: true,
		access_level: 0,
		role: 'normal'
	});

	// Return a success message
	return { error: false, message: 'Email verification successful!' };
};

interface CodeDoc {
	email: string;
	code: string;
	expires_at: Timestamp;
}