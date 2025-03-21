import { ID_ENCRYPTION_KEY } from "$env/static/private";
import { ORDERS } from "$lib/firebase/collections";
import type { Order } from "$models/order";
import { error } from "@sveltejs/kit";
import CryptoJS from "crypto-js";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import type { PageServerLoad } from "../$types";

interface Params {
    orderId: string;
}

export const load: PageServerLoad = async ({ params, url }) => {
    let decryptedId: string;
    try {
        decryptedId = CryptoJS.AES.decrypt(
            (params as Params).orderId,
            ID_ENCRYPTION_KEY
        ).toString(CryptoJS.enc.Utf8);
        if (!decryptedId) {
            throw error(400, "Invalid order ID");
        }
    } catch (e) {
        throw error(400, "Invalid order ID");
    }

    const orderDocRef = doc(ORDERS, decryptedId);
    const orderDoc = await getDoc(orderDocRef);

    if (!orderDoc.exists()) {
        throw error(404, "Order not found");
    }

    const orderData = orderDoc.data();
    const order: Order = {
        firebaseId: orderDoc.id,
        ticketId: orderData?.ticketId,
        done: orderData?.done,
        name: orderData?.name,
        surname: orderData?.surname,
        email: orderData?.email,
        items: orderData?.items,
        creationDate: (orderData?.creationDate as Timestamp).toDate(),
        closeDate: orderData?.closeDate
            ? (orderData?.closeDate as Timestamp).toDate()
            : undefined,
    };

    return {
        order,
    };
};
