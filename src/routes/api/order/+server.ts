import { handleRequest as handlePOSTRequest } from "./POST";
import { handleRequest as handlePATCHRequest } from "./PATCH";

export async function POST({ request, locals }) {
    return handlePOSTRequest(request, locals);
}

export async function PATCH({ request, locals }) {
    return handlePATCHRequest(request, locals);
}
