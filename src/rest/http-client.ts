import http, { RefinedParams, RefinedResponse, ResponseType } from "k6/http";

import { getAccessToken } from "../token";
import { getHeaders } from "./http-headers";
import { createMultipartBody } from "./multipart-request-helper";
//import { trackCheck, trackDuration } from "../metricsUtil";
import encoding from "k6/encoding";
import exec from "k6/execution";


export function sendRequest(
    method: string,
    url: string,
    body?: object,
    headers?: Record<string, string> | { [key: string]: string },
    tags?: { [key: string]: string }
): RefinedResponse<"text"> {

    if (!headers) {
        const accessToken: string = getAccessToken();
        headers = accessToken.trim().length > 0 ? getHeaders(accessToken) : undefined;
    }

    //console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>> URL: ${url}`);

    const phase: string = (exec.vu.tags?.phase as string) || "unknown";

    const mergedTags = {
        ...(tags || {}),
        phase,                    // ensures every http metric can be filtered by phase
    };

    return http.request<"text">(
        method,
        url,
        body ? JSON.stringify(body) : null,
        {
            headers,
            tags: mergedTags,
            responseType: "text"
        }
    );
}


export function sendRequestWithParams(
    method: string,
    url: string,
    body?: object,
    headers?: Record<string, string>,
    queryParams?: { [key: string]: string | number },
    requestParams?: object,
    tags?: { [key: string]: string },
): RefinedResponse<"text"> {

    if (!headers) {
        const accessToken: string = getAccessToken();

        //console.log(`>>>>>>>>>> ACCESS TOKEN: ${accessToken}`)

        headers =
            accessToken.trim().length > 0
                ? getHeaders(accessToken)
                : undefined;
    }

    //console.log(`>>>>>>>>>> URL: ${url}`)

    const phase: string = (exec.vu.tags?.phase as string) || "unknown";

    const mergedTags = {
        ...(tags || {}),
        phase,                    // ensures every http metric can be filtered by phase
    };

    if (queryParams && Object.keys(queryParams).length > 0) {

        const queryString: string = Object.entries(queryParams)
            .map(([k, v]: [string, string | number]): string =>
                `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
            )
            .join("&");

        url += (url.includes("?") ? "&" : "?") + queryString;
    }

    //console.log(`URL: ${url}`);

    const params: RefinedParams<"text"> = {
        headers,
        tags: mergedTags,
        responseType: "text",
        ...(requestParams || {})
    };

    return http.request<"text">(
        method,
        url,
        body ? JSON.stringify(body) : null,
        params
    );
}


export function sendMultipartRequest(
    url: string,
    fileContent: string | ArrayBuffer,
    filename: string,
    importConfig: Record<string, any>,   // e.g. { preview: false }
    headers?: Record<string, string>,
    contentType = "application/xml",
    tags?: { [key: string]: string },
): RefinedResponse<"text"> {

    if (!headers) {
        const token: string = getAccessToken();

        headers =
            token.trim().length > 0
                ? getHeaders(token)
                : {};
    }

    const phase: string = (exec.vu.tags?.phase as string) || "unknown";

    const mergedTags = {
        ...(tags || {}),
        phase,                    // ensures every http metric can be filtered by phase
    };

    // IMPORTANT send both parts as proper multipart parts
    const form: Record<string, any> = {

        importConfig: http.file(
            JSON.stringify(importConfig),
            "importConfig.json",
            "application/json"
        ),

        // file part (name must match what backend expects: commonly "file")
        file: http.file(fileContent, filename, contentType),
    };

    // Let k6 set Content-Type + boundary automatically
    if ("Content-Type" in headers) {
        delete headers["Content-Type"];
    }

    return http.post(
        url,
        form,
        {
            headers,
            tags: mergedTags,
            responseType: "text"
        }
    );
}


function sendRequestWithTracking(
    method: string,
    url: string,
    body?: object,
    tags?: { [key: string]: string }
): RefinedResponse<"text"> {

    const response: RefinedResponse<"text"> =
        sendRequest(method, url, body, undefined, tags);

    const name: string = tags?.name || `${method}_${url}`;

    //trackDuration(name, response.timings.duration);

    // trackCheck(
    //     name,
    //     response.status >= 200 && response.status < 300
    // );

    return response;
}
