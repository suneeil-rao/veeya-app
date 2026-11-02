import exec from "k6/execution";
import http, {
    type RefinedParams,
    type RefinedResponse,
    type StructuredRequestBody,
} from "k6/http";

import { getAccessToken } from "../token";
import { createJsonHeaders, withoutContentType } from "./http-headers";
import type {
    Headers,
    HttpMethod,
    MultipartRequestOptions,
    QueryParams,
    RequestTags,
    RestRequestOptions,
} from "./types";

function resolveHeaders(headers?: Headers): Headers {
    if (headers) {
        return { ...headers };
    }

    const token: string = getAccessToken();
    return createJsonHeaders(token);
}

function appendQueryParams(url: string, queryParams?: QueryParams): string {
    if (!queryParams || Object.keys(queryParams).length === 0) {
        return url;
    }

    const queryString: string = Object.entries(queryParams)
        .map(
            ([name, value]: [string, string | number | boolean]): string =>
                `${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`,
        )
        .join("&");

    return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
}

function mergeTags(tags?: RequestTags): RequestTags {
    const phase: string = String(exec.vu.tags?.phase ?? "unknown");
    return { ...(tags ?? {}), phase };
}

export function sendRequest(
    method: HttpMethod,
    url: string,
    options: RestRequestOptions = {},
): RefinedResponse<"text"> {
    const params: RefinedParams<"text"> = {
        ...(options.params ?? {}),
        headers: resolveHeaders(options.headers),
        tags: mergeTags(options.tags),
        responseType: "text",
    };

    const body: string | null =
        options.body === undefined ? null : JSON.stringify(options.body);

    return http.request<"text">(
        method,
        appendQueryParams(url, options.queryParams),
        body,
        params,
    );
}

export function sendMultipartRequest(
    url: string,
    options: MultipartRequestOptions,
): RefinedResponse<"text"> {
    const headers: Headers = withoutContentType(
        resolveHeaders(options.headers),
    );

    const form: StructuredRequestBody = {
        importConfig: http.file(
            JSON.stringify(options.importConfig),
            "importConfig.json",
            "application/json",
        ),
        file: http.file(
            options.fileContent,
            options.filename,
            options.contentType ?? "application/xml",
        ),
    };

    const params: RefinedParams<"text"> = {
        ...(options.params ?? {}),
        headers,
        tags: mergeTags(options.tags),
        responseType: "text",
    };

    return http.post<"text">(url, form, params);
}
