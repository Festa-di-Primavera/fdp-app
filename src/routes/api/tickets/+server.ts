import { handleRequest as handlePOSTRequest } from "./POST";
import { handleRequest as handleGETRequest } from "./GET";
import { handleRequest as handlePUTRequest } from "./PUT";


export async function GET({ locals }) {
    return handleGETRequest(locals);
}

export async function POST({ request, locals }) {
    return handlePOSTRequest(request, locals);
}

export async function PUT({ request, locals }) {
    return handlePUTRequest(request, locals);
}
