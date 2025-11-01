import { handleRequest } from "./PUT";

export async function PUT({ params, locals, request }) {
    return handleRequest(params, locals, request);
}
