import { check, group, sleep } from "k6";

import { sendRequest } from "../src/rest-util/index";

const BASE_URL =
    __ENV.REST_BASE_URL ?? "http://18.61.197.172:8000";

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ["rate==1"],
    },
};

function serializeForLog(value: unknown): string {
    return JSON.stringify(value, (key: string, entry: unknown): unknown =>
        /password|secret|token|authorization|cookie|email/i.test(key)
            ? "[REDACTED]"
            : entry,
    );
}

export default function (): void {
    const email = __ENV.LOGIN_EMAIL;
    const password = __ENV.LOGIN_PASSWORD;
    if (!email || !password) {
        throw new Error("LOGIN_EMAIL and LOGIN_PASSWORD must be set.");
    }

    group("valid-login", (): void => {
        const url = `${BASE_URL}/api/v1/auth/login`;
        const requestOptions = {
            body: {
                email,
                password,
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            tags: {
                name: "Login",
            },
        };

        console.log(`Request: ${serializeForLog({ method: "POST", url, ...requestOptions })}`);
        const response = sendRequest("POST", url, requestOptions);

        let responseBody: unknown;
        try {
            responseBody = JSON.parse(response.body);
        } catch {
            responseBody = "[Non-JSON body omitted to avoid exposing credentials]";
        }
        console.log(`Response: ${serializeForLog({
            status: response.status,
            headers: response.headers,
            body: responseBody,
            durationMs: response.timings.duration,
            errorCode: response.error_code,
        })}`);

        check(response, {
            "Login returns 202": (result): boolean =>
                result.status === 202,
        });
    });

    // group("list employees", (): void => {
    //     const response = sendRequest("GET", `${BASE_URL}/employees`, {
    //         headers: {
    //             Accept: "application/json",
    //             "Content-Type": "application/json",
    //             "X-Correlation-Id": "run-123",
    //         },
    //         tags: {
    //             name: "ListEmployees",
    //         },
    //     });

    //     check(response, {
    //         "employee list returns 200": (result): boolean =>
    //             result.status === 200,
    //     });
    // });

    sleep(1);
}

// npm run build:login
// Set LOGIN_EMAIL and LOGIN_PASSWORD in the environment before running.
// k6 run --vus 1 --duration 5s -e REST_BASE_URL=http://18.61.197.172:8000 /tmp/login-test.js

//VUS with Iterations
// k6 run --vus 2 --iterations 2 -e REST_BASE_URL=http://18.61.197.172:8000 -e LOGIN_EMAIL='sudeeshgnair@gmail.com' -e LOGIN_PASSWORD='Testing@1' /tmp/login-test.js

//VUS with Duration
// k6 run --vus 2 --duration 30s -e REST_BASE_URL=http://18.61.197.172:8000 -e LOGIN_EMAIL='sudeeshgnair@gmail.com' -e LOGIN_PASSWORD='Testing@1' /tmp/login-test.js