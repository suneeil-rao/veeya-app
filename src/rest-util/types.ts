import type { RefinedParams } from "k6/http";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
    | JsonPrimitive
    | JsonValue[]
    | { [key: string]: JsonValue };

export type HttpMethod =
    | "DELETE"
    | "GET"
    | "HEAD"
    | "OPTIONS"
    | "PATCH"
    | "POST"
    | "PUT";

export type Headers = Record<string, string>;
export type QueryParams = Record<string, string | number | boolean>;
export type RequestTags = Record<string, string>;

export type AdditionalRequestParams = Omit<
    Partial<RefinedParams<"text">>,
    "headers" | "responseType" | "tags"
>;

export interface RestRequestOptions {
    body?: JsonValue;
    headers?: Headers;
    queryParams?: QueryParams;
    params?: AdditionalRequestParams;
    tags?: RequestTags;
}

export interface MultipartRequestOptions {
    fileContent: string | ArrayBuffer;
    filename: string;
    importConfig: Record<string, unknown>;
    contentType?: string;
    headers?: Headers;
    params?: AdditionalRequestParams;
    tags?: RequestTags;
}
