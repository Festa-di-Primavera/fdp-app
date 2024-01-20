import { /*deleteApp, getApp, getApps,*/ initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

//import { API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET, MESSAGING_SENDER_ID, APP_ID } from "$env/static/private";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
};

// Initialize Firebase
// if (!getApps().length) {
//     firebaseApp = initializeApp(firebaseConfig)
// } else {
//     firebaseApp = getApp()
//     deleteApp(firebaseApp)
const firebaseApp = initializeApp(firebaseConfig)
// }

export const db = getFirestore(firebaseApp)
export const auth = getAuth(firebaseApp)
