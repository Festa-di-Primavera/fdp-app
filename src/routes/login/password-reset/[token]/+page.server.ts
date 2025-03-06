import { invalidateUserSessions } from "$lib/auth/session";
import {
    isSameAsOldPassword,
    verifyPasswordResetToken,
} from "$lib/auth/utils/password";
import { getClientDB } from "$lib/firebase/client";
import { PASSWORD_RESET_TOKENS, USERS } from "$lib/firebase/collections";
import { hash } from "@node-rs/argon2";
import { fail, redirect } from "@sveltejs/kit";
import { doc, runTransaction } from "firebase/firestore";
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async ({ params }) => {
    interface Params {
        token: string;
    }

    const passwordResetToken = (params as Params).token;

    if (!passwordResetToken) {
        fail(400, {
            error: true,
            message: "Invalid password reset token",
        });
    }

    const { error, message } = await verifyPasswordResetToken(
        passwordResetToken
    );

    if (error) {
        fail(400, {
            error: true,
            message,
        });
    }
};

export const actions = {
    passwordReset: async ({
        request,
        locals,
    }): Promise<{ error: boolean; message: string }> => {
        if (locals.user) return redirect(302, "/");

        const formData = await request.formData();
        const password = formData.get("password") as string;
        const passwordRepeat = formData.get("password_repeat") as string;
        const passwordResetToken = formData.get("token") as string;

        if (!password || !passwordRepeat) {
            return {
                error: true,
                message: "La nuova password non può essere vuota",
            };
        }

        if (!passwordResetToken) {
            return {
                error: true,
                message: "Token di reset password invalido!",
            };
        }

        if (password !== passwordRepeat) {
            return { error: true, message: "Le password non coincidono" };
        }

        const { error, userId, message } = await verifyPasswordResetToken(
            passwordResetToken
        );

        if (error) {
            return { error: true, message };
        }

        if (userId) {
            //check if password is equal to previous password
            if (await isSameAsOldPassword(userId, password)) {
                return {
                    error: true,
                    message: "La password è uguale alla precedente",
                };
            }

            const passwordHash = await hash(password, {
                // recommended minimum parameters
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1,
            });
            await invalidateUserSessions(userId);

            await runTransaction(getClientDB(), async (trx) => {
                trx.delete(doc(PASSWORD_RESET_TOKENS, userId));
                trx.update(doc(USERS, userId), {
                    password_hash: passwordHash,
                });
            });

            redirect(302, "/login");
        }

        return { error: false, message: "Password resettata correttamente!" };
    },
};
