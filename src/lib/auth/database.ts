import { getClientDB } from "$lib/firebase/client";
import { collection } from "firebase/firestore";

export const sessionCollection = collection(getClientDB(), "sessions");
export const userCollection = collection(getClientDB(), "users");