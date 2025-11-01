import type { RequestEvent } from "@sveltejs/kit";
import { handleRequest } from "./GET";

export async function GET(event: RequestEvent): Promise<Response> {
    return handleRequest(event);
}
