import { handleRequest } from "./POST";

export async function POST({ request, locals }) {
    return handleRequest(request, locals);
}
