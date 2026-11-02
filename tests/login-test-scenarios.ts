import { check, group, sleep } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

import { sendRequest } from "../src/rest-util/index";

// Bundle: npm run build:login-scenarios
// Run with LOGIN_MODE=valid, invalid, or mixed (default) using k6 -e.
// Required: REST_BASE_URL and credentials for each selected login type.
// Valid credentials: LOGIN_EMAIL, LOGIN_PASSWORD.
// Invalid credentials: INVALID_LOGIN_EMAIL, INVALID_LOGIN_PASSWORD.
// INVALID_EXPECTED_STATUS defaults to 401; valid logins must return 202.
// Each mixed iteration sends one valid and one invalid login request.
const mode = __ENV.LOGIN_MODE ?? "mixed";
if (!["valid", "invalid", "mixed"].includes(mode)) {
  throw new Error("LOGIN_MODE must be valid, invalid, or mixed.");
}

function requiredEnvironment(name: string): string {
  const value = __ENV[name];
  if (!value) {
    throw new Error(`${name} must be set.`);
  }
  return value;
}

type LoginType = "valid" | "invalid";

interface LoginCase {
  type: LoginType;
  email: string;
  password: string;
  expectedStatus: number;
}

const baseUrl = requiredEnvironment("REST_BASE_URL").replace(/\/+$/, "");
const loginCases: LoginCase[] = [];

if (mode === "valid" || mode === "mixed") {
  loginCases.push({
    type: "valid",
    email: requiredEnvironment("LOGIN_EMAIL"),
    password: requiredEnvironment("LOGIN_PASSWORD"),
    expectedStatus: 202,
  });
}

if (mode === "invalid" || mode === "mixed") {
  const expectedStatus = Number(__ENV.INVALID_EXPECTED_STATUS ?? "401");
  if (
    !Number.isInteger(expectedStatus) ||
    expectedStatus < 400 ||
    expectedStatus > 499
  ) {
    throw new Error("INVALID_EXPECTED_STATUS must be a 4xx status code.");
  }
  loginCases.push({
    type: "invalid",
    email: requiredEnvironment("INVALID_LOGIN_EMAIL"),
    password: requiredEnvironment("INVALID_LOGIN_PASSWORD"),
    expectedStatus,
  });
}

const thresholds: NonNullable<Options["thresholds"]> = {};
for (const loginCase of loginCases) {
  const selector = `{login_type:${loginCase.type}}`;
  thresholds[`checks${selector}`] = ["rate==1"];
  thresholds[`http_req_failed${selector}`] = ["rate==0"];
  // Nonrestrictive thresholds expose counts and timings in the summary.
  thresholds[`http_reqs${selector}`] = ["count>0"];
  thresholds[`http_req_duration${selector}`] = ["p(95)>=0"];
}

export const options: Options = {
  vus: 1,
  iterations: 1,
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "max"],
  thresholds,
};

export default function (): void {
  for (const loginCase of loginCases) {
    group(`${loginCase.type}-login`, (): void => {
      const tags = { login_type: loginCase.type };
      const response = sendRequest("POST", `${baseUrl}/api/v1/auth/login`, {
        body: { email: loginCase.email, password: loginCase.password },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        tags: { ...tags, name: `Login-${loginCase.type}` },
        params: {
          responseCallback: http.expectedStatuses(loginCase.expectedStatus),
          redirects: 0,
        },
      });

      check(
        response,
        {
          [`${loginCase.type} login returns ${loginCase.expectedStatus}`]: (
            result,
          ): boolean => result.status === loginCase.expectedStatus,
        },
        tags,
      );
    });
  }
  sleep(1);
}
/*
k6 run --vus 2 --iterations 2 \
-e REST_BASE_URL="http://18.61.197.172:8000" \
-e LOGIN_MODE=mixed \
-e LOGIN_EMAIL="sudeeshgnair@gmail.com" \
-e LOGIN_PASSWORD="Testing@1" \
-e INVALID_LOGIN_EMAIL='invalid@example.test' \
-e INVALID_LOGIN_PASSWORD='Testing@1234' \
/tmp/login-test-scenarios.js
*/