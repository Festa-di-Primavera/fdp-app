import { handleRequest } from "./PUT";

export async function PUT({ params, locals }) {
    return handleRequest(params, locals);
}
