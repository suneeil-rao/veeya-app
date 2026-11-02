import http, { RefinedResponse, ResponseType } from "k6/http";
import { check, sleep } from "k6";
import encoding from "k6/encoding";
//import { registerMetrics } from "./metricsUtil";
//import { generateAiSummary } from "./aiSummaryUtil";

let accessToken: string = "null";
let tokenExpiry: number | null = null;

export function getAccessToken(): string {
    const currentTime: number = Date.now();

    const clientId: string = __ENV.CLIENT_ID || "";

    const clientSecret: string =
        __ENV.CLIENT_SECRET || "<REDACTED_CLIENT_SECRET>";

    const basicAuthHeader: string =
        createBasicAuthHeader(clientId, clientSecret);

    if (accessToken && tokenExpiry && currentTime < tokenExpiry) {
        return accessToken;
    }

    console.log("Token expired or missing. Fetching a new one...");

    const tokenUrl: string = __ENV.IAM_URL || "";

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": basicAuthHeader,
    };

    const payload = {
        grant_type: "client_credentials",
        scope: "default",
    };

    const encodedPayload: string = Object.keys(payload)
        .map(
            (key: string) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(
                    payload[key as keyof typeof payload]
                )}`
        )
        .join("&");

    const response: RefinedResponse<ResponseType | undefined> =
        http.post(
            `${tokenUrl}?${encodedPayload}`,
            null,
            {
                headers,
                tags: {
                    name: "IAM",
                },
            }
        );

    /*
    const response =
        sendRequest(
            "POST",
            `${tokenUrl}?${encodedPayload}`,
            payload,
            headers,
            { name: "IAM" }
        );
    */

    check(response, {
        "token fetched successfully": (
            r: RefinedResponse<ResponseType | undefined>
        ): boolean => r.status === 200,
    });

    if (response.status !== 200) {
        throw new Error(
            `Failed to fetch token: ${response.status}, body: ${response.body}`
        );
    }

    const tokenData: any = JSON.parse(response.body as string);

    if (!tokenData.access_token) {
        throw new Error("Access token missing in response!");
    }

    accessToken = tokenData.access_token;

    tokenExpiry =
        Date.now() + tokenData.expires_in * 1000;

    console.log("## New token acquired.");

    //console.log(`AccessToken: ${accessToken}`)

    return accessToken;
}

export function createBasicAuthHeader(
    clientId: string,
    clientSecret: string
): string {
    const credentials = `${clientId}:${clientSecret}`;

    const encodedCredentials: string =
        encoding.b64encode(credentials);

    return `Basic ${encodedCredentials}`;
}
