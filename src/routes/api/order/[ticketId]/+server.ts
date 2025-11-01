import { handleRequest } from "./GET.js";

export async function GET({ locals, params }) {
    return handleRequest(params, locals);
}
