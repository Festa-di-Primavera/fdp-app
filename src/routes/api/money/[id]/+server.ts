import { handleRequest } from "./POST";

export async function POST({ request, params, locals }) {
    return handleRequest(request, params, locals);
}
