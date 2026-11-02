import { check, group, sleep } from "k6";

import { sendRequest } from "../src/rest-util/index";

const BASE_URL =
    __ENV.REST_BASE_URL ?? "https://dummy.restapiexample.com/api/v1";

export const options = {
    vus: 1,
    iterations: 1,
};

export default function (): void {
    group("create employee", (): void => {
        const response = sendRequest("POST", `${BASE_URL}/create`, {
            body: {
                name: "test",
                salary: "123",
                age: "23",
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            tags: {
                name: "CreateEmployee",
            },
        });

        check(response, {
            "employee creation returns 200": (result): boolean =>
                result.status === 200,
        });
    });

    group("list employees", (): void => {
        const response = sendRequest("GET", `${BASE_URL}/employees`, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-Correlation-Id": "run-123",
            },
            tags: {
                name: "ListEmployees",
            },
        });

        check(response, {
            "employee list returns 200": (result): boolean =>
                result.status === 200,
        });
    });

    sleep(1);
}
