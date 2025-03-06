import { USERS } from "$lib/firebase/collections";
import { doc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { hashPassword } from "./utils/password";

export interface GoogleUser {
    sub: string;
    name: string;
    picture: string;
    email: string;
    email_verified: boolean;
}

export interface User {
    id: string;

    google_id?: string;
    avatar_url?: string;

    username: string;
    email: string;
    email_verified: boolean;
    password_hash?: string;

    alias: string;
    permissions: number;
    total_from_sales: number;
    owned_money: number;
}

export async function createUser(
    email: string,
    username: string,
    password: string
): Promise<User> {
    const passwordHash = await hashPassword(password);

    const userId = uuidv4();

    const user: User = {
        id: userId,

        username: username,
        email: email,
        email_verified: false,
        password_hash: passwordHash,

        alias: username,
        permissions: 0,
        owned_money: 0,
        total_from_sales: 0,
    };

    await setDoc(doc(USERS, userId), user);

    return user;
}

export async function createUserWithGoogle(
    googleUser: GoogleUser
): Promise<User> {
    const userId = uuidv4();

    const user: User = {
        id: userId,

        google_id: googleUser.sub,
        avatar_url: googleUser.picture,

        username: googleUser.name,
        email: googleUser.email,
        email_verified: googleUser.email_verified,

        alias: googleUser.name,
        permissions: 0,
        total_from_sales: 0,
        owned_money: 0,
    };

    await setDoc(doc(USERS, userId), user);

    return user;
}
