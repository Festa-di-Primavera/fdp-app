import { handleRequest } from "./PUT.js";

export async function PUT({ params, locals }) {
    return handleRequest(params, locals);
}
