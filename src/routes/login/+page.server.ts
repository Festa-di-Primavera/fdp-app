import {
    createSession,
    deleteSessionTokenCookie,
    generateSessionToken,
    invalidateUserSessions,
    setSessionTokenCookie,
} from "$lib/auth/session";
import { createUser } from "$lib/auth/user";
import {
    generateEmailVerificationCode,
    isValidEmail,
    sendVerificationCode,
} from "$lib/auth/utils/email";
import {
    EMAIL_VERIFICATION_CODES,
    PASSWORD_RESET_TOKENS,
    USERS,
} from "$lib/firebase/collections";
import { verify } from "@node-rs/argon2";
import { fail, redirect, type Actions } from "@sveltejs/kit";
import { deleteDoc, doc, getDocs, or, query, where } from "firebase/firestore";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        if (!locals.user.email_verified) redirect(302, "/login/verify-email");
        else redirect(302, "/");
    }
};

export const actions: Actions = {
    signup: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;
        const passwordRepeat = formData.get("password_repeat") as string;
        const email = formData.get("email") as string;

        if (
            typeof password !== "string" ||
            password.length < 8 || // minimum 8 characters
            !/[A-Z]/.test(password) || // at least one uppercase letter
            !/[0-9]/.test(password) || // at least one number
            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password) // at least one special character
        ) {
            return fail(400, {
                error: true,
                message: "Password non valida",
            });
        }
        if (password !== passwordRepeat) {
            return fail(400, {
                error: true,
                message: "Le password non corrispondono",
            });
        }
        if (typeof email !== "string" || !isValidEmail(email)) {
            return fail(400, {
                error: true,
                message: "Email non valida",
            });
        }

        // Check if email or username already exists
        const userQuery = query(
            USERS,
            or(where("email", "==", email), where("username", "==", username))
        );
        const existingUsers = (await getDocs(userQuery)).docs;

        const equalEmail = existingUsers.find((u) => u.data().email === email);
        if (equalEmail) {
            return fail(400, {
                error: true,
                message: "Email già in uso",
            });
        }

        const equalUsername = existingUsers.find(
            (u) => u.data().username === username
        );
        if (equalUsername) {
            return fail(400, {
                error: true,
                message: "Username già in uso",
            });
        }

        // Create user
        const user = await createUser(email, username, password);

        // Send verification email
        const verificationCode = await generateEmailVerificationCode(
            user.id,
            email
        );
        await sendVerificationCode(email, verificationCode);

        // Create session
        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        setSessionTokenCookie(event, token, session.expiresAt);

        redirect(302, "/");
    },
    signin: async (event) => {
        const formData = await event.request.formData();
        const email = formData.get("email");
        const isUsername = (email as string)?.includes("@") ? false : true;
        const password = formData.get("password");

        const q = query(
            USERS,
            where(isUsername ? "username" : "email", "==", email as string)
        );
        const existingUser = (await getDocs(q)).docs[0]?.data();

        if (!existingUser) {
            return fail(400, {
                error: true,
                message: "Utente e password non corretti",
            });
        }

        if (!existingUser.password_hash) {
            return fail(400, {
                error: true,
                message:
                    "Utente registrato con Google.\nL'accesso con email e password è disabilitato",
            });
        }

        const validPassword = await verify(
            existingUser.password_hash,
            password as string,
            {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1,
            }
        );
        if (!validPassword) {
            return fail(400, {
                error: true,
                message: "Utente e password non corretti",
            });
        }

        // Create session
        const token = generateSessionToken();
        const session = await createSession(token, existingUser.id);
        setSessionTokenCookie(event, token, session.expiresAt);

        if (existingUser.email_verified) redirect(302, "/");
        else redirect(302, "/login/verify-email");
    },
    delete: async (event) => {
        if (!event.locals.user) {
            return fail(400, {
                error: true,
                message: "Utente non autenticato",
            });
        }

        const userId = event.locals.user.id;

        await deleteDoc(doc(USERS, userId));

        await deleteDoc(doc(EMAIL_VERIFICATION_CODES, userId));

        await deleteDoc(doc(PASSWORD_RESET_TOKENS, userId));

        await invalidateUserSessions(userId);
        deleteSessionTokenCookie(event);

        redirect(302, "/login");
    },
};
