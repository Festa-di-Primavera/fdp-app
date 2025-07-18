import { getClientDB } from "$lib/firebase/client";
import { PASSWORD_RESET_TOKENS, USERS } from "$lib/firebase/collections";
import { hash, verify } from "@node-rs/argon2";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import {
    doc,
    getDoc,
    getDocs,
    query,
    runTransaction,
    Timestamp,
    where,
} from "firebase/firestore";
import { TimeSpan } from "../../../models/timespan";
import { sendEmail } from "../../utils/resend";
import type { User } from "../user";
import { passwordResetTemplate } from "../email-templates/password_reset";
import { createDate, isWithinExpirationDate } from "./timespan";

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
        parallelism: 1,
    });
}

export async function verifyPasswordHash(
    hash: string,
    password: string
): Promise<boolean> {
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
    const tokenHash = encodeHexLowerCase(sha256(new TextEncoder().encode(tokenId)));

    const db = getClientDB();

    await runTransaction(db, async (trx) => {
        trx.delete(doc(PASSWORD_RESET_TOKENS, userId));
        trx.set(doc(PASSWORD_RESET_TOKENS, userId), {
            token_hash: tokenHash,
            user_id: userId,
            expires_at: createDate(new TimeSpan(15, "m")), // 15 minutes
        });
    });

    return tokenId;
};

/// Verify the token and return the user id
export const verifyPasswordResetToken = async (tokenId: string) => {
    const passwordResetQuery = query(
        PASSWORD_RESET_TOKENS,
        where(
            "token_hash",
            "==",
            encodeHexLowerCase(sha256(new TextEncoder().encode(tokenId)))
        )
    );
    const passwordResetTokenDoc = (
        await getDocs(passwordResetQuery)
    ).docs[0]?.data() as PasswordResetToken;

    if (!passwordResetTokenDoc) {
        return {
            error: true,
            message:
                "Il link di reset password non è valido! Per favore richiedi un nuovo link",
        };
    }

    if (!isWithinExpirationDate(passwordResetTokenDoc.expires_at.toDate())) {
        return {
            error: true,
            message:
                "Il link di reset password è scaduto! Per favore richiedi un nuovo link",
        };
    }

    return {
        error: false,
        userId: passwordResetTokenDoc.user_id,
        message: "Token di reset password valido",
    };
};

/// Send an email with the reset link to the user using resend
export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string
) => {
    return await sendEmail(
        email,
        "Richiesta di Reset Password",
        passwordResetTemplate(resetToken)
    );
};

/// Check if the new password is the same as the old password
export const isSameAsOldPassword = async (
    userId: string,
    newPassword: string
) => {
    const userDoc = (await getDoc(doc(USERS, userId))).data() as User;

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