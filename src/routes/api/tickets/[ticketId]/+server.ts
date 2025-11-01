

import { handleRequest as handleGETRequest } from "./GET";
import { handleRequest as handlePUTRequest } from "./PUT";
import { handleRequest as handlePOSTRequest } from "./POST";

export async function GET({ params, locals }) {
    return handleGETRequest(params, locals);
}

export async function PUT({ params, locals }) {
    return handlePUTRequest(params, locals);
}

export async function POST({ params, request, locals }) {
    return handlePOSTRequest(params, request, locals);
}
