import { handleRequest } from './POST';

export async function POST({ locals, request }) {
    return handleRequest(locals, request);
}
