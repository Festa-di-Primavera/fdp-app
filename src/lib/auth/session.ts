import { sha256 } from "@oslojs/crypto/sha2";
import {
    encodeBase32LowerCaseNoPadding,
    encodeHexLowerCase,
} from "@oslojs/encoding";
import type { RequestEvent } from "@sveltejs/kit";
import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { sessionCollection, userCollection } from "./database";
import type { User } from "./user";
import { TimeSpan } from "./utils/timespan";

type SessionValidationResult =
    | { session: Session; user: User }
    | { session: null; user: null };

interface Session {
    id: string;
    expiresAt: Date;
    userId: string;
}

const SESSION_EXPIRES_IN = new TimeSpan(2, "w");

export async function validateSessionToken(
    token: string
): Promise<SessionValidationResult> {
    const sessionId = encodeHexLowerCase(
        sha256(new TextEncoder().encode(token))
    );

    const sessionDocRef = doc(sessionCollection, sessionId);
    const sessionSnapshot = await getDoc(sessionDocRef);

    if (!sessionSnapshot.exists()) return { user: null, session: null };
    const sessionDoc = sessionSnapshot.data();

    const userDocRef = doc(userCollection, sessionDoc.userId);
    const userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) return { user: null, session: null };
    const userDoc = userSnapshot.data();

    const session: Session = {
        id: sessionId,
        userId: sessionDoc.userId,
        expiresAt: sessionDoc.expiresAt.toDate(),
    };
    const user: User = {
        id: userDoc.id,

        google_id: userDoc.google_id,
        avatar_url: userDoc.avatar_url,

        username: userDoc.username,
        email: userDoc.email,
        email_verified: userDoc.email_verified,
        password_hash: userDoc.password_hash,

        alias: userDoc.alias,
        permissions: userDoc.permissions,
        total_from_sales: userDoc.total_from_sales,
        owned_money: userDoc.owned_money,
    };

    if (Date.now() > session.expiresAt.getTime()) {
        await deleteDoc(sessionDocRef);
        return { session: null, user: null };
    }
    if (
        Date.now() >=
        session.expiresAt.getTime() - SESSION_EXPIRES_IN.milliseconds() / 2
    ) {
        session.expiresAt = new Date(
            Date.now() + SESSION_EXPIRES_IN.milliseconds()
        );
        await updateDoc(sessionDocRef, { expiresAt: session.expiresAt });
    }

    return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
    const sessionDocRef = doc(sessionCollection, sessionId);
    await deleteDoc(sessionDocRef);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
    const q = query(sessionCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(getFirestore());
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}

export function setSessionTokenCookie(
    event: RequestEvent,
    token: string,
    expiresAt: Date
): void {
    event.cookies.set("session", token, {
        httpOnly: true,
        path: "/",
        secure: import.meta.env.PROD,
        sameSite: "lax",
        expires: expiresAt,
    });
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
    event.cookies.set("session", "", {
        httpOnly: true,
        path: "/",
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 0,
    });
}

export function generateSessionToken(): string {
    const tokenBytes = new Uint8Array(20);
    crypto.getRandomValues(tokenBytes);
    const token = encodeBase32LowerCaseNoPadding(tokenBytes).toLowerCase();
    return token;
}

export async function createSession(
    token: string,
    userId: string
): Promise<Session> {
    const sessionId = encodeHexLowerCase(
        sha256(new TextEncoder().encode(token))
    );
    const session: Session = {
        id: sessionId,
        userId,
        expiresAt: new Date(Date.now() + SESSION_EXPIRES_IN.milliseconds()),
    };

    const sessionDoc = doc(sessionCollection, session.id);
    await setDoc(sessionDoc, {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
    });

    return session;
}

export async function invalidateExpiredSessions(): Promise<void> {
    const q = query(
        sessionCollection,
        where("expiresAt", "<=", new Date(Date.now()))
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(getFirestore());
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}
