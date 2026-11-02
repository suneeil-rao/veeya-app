import type { Headers } from "./types";

export function createJsonHeaders(token?: string): Headers {
    const headers: Headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    };

    if (token?.trim()) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

export function withoutContentType(headers: Headers): Headers {
    return Object.fromEntries(
        Object.entries(headers).filter(
            ([name]: [string, string]): boolean =>
                name.toLowerCase() !== "content-type",
        ),
    );
}
