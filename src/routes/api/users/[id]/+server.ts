import { handleRequest } from "./DELETE";

export async function DELETE({ params, locals }) {
    return handleRequest(params, locals);
}