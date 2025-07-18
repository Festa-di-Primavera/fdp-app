import { EMAIL_VERIFICATION_CODES, USERS } from "$lib/firebase/collections";
import {
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import { generateRandomString } from "@oslojs/crypto/random"
import type { RandomReader } from "@oslojs/crypto/random";

import { sendEmail } from "../../utils/resend";
import { verificationCodeTemplate } from "../email-templates/verification_code";
import { createDate } from "./timespan";
import { isWithinExpirationDate, TimeSpan } from "$models/timespan";

export function isValidEmail(email: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

const random: RandomReader = {
	read(bytes) {
		crypto.getRandomValues(bytes);
	}
};
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/// Generate a random 6-digit code and store it in the database
export async function generateEmailVerificationCode(
    userId: string,
    email: string
): Promise<string> {
    await deleteDoc(doc(EMAIL_VERIFICATION_CODES, userId));

    const code = generateRandomString(random, alphabet, 6);
    await setDoc(doc(EMAIL_VERIFICATION_CODES, userId), {
        email,
        code,
        expires_at: createDate(new TimeSpan(15, "m")),
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
        "Codice di Verifica Email",
        verificationCodeTemplate(code)
    );
}

/// Verify the email verification code and update the user's email_verified field
export const verifyEmailVerificationCode = async (
    userId: string,
    code: string
) => {
    interface CodeDoc {
        email: string;
        code: string;
        expires_at: Timestamp;
    }

    const codeDoc = (
        await getDoc(doc(EMAIL_VERIFICATION_CODES, userId))
    ).data() as CodeDoc;

    const { code: verificationCode, expires_at } = codeDoc;

    // If there's no verification code for the user in the database
    if (!verificationCode) {
        return { error: true, message: "Verification code not found." };
    }

    // If the provided code doesn't match the one in the database
    if (verificationCode !== code) {
        return {
            error: true,
            message: "The provided verification code is incorrect.",
        };
    }

    // If the verification code has expired
    if (!isWithinExpirationDate(expires_at.toDate())) {
        return {
            error: true,
            message:
                "The verification code has expired, please request a new one.",
        };
    }

    // If everything is okay, delete the verification code from the database
    await deleteDoc(doc(EMAIL_VERIFICATION_CODES, userId));
    await updateDoc(doc(USERS, userId), {
        email_verified: true,
    });

    // Return a success message
    return { error: false, message: "Email verification successful!" };
};
