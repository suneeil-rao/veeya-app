# k6 performance tests

TypeScript helpers and login tests for k6. Run the commands below from the project root.

## Install prerequisites

Install these once on each machine:

1. **Node.js with npm:** use a current LTS installer from [Node.js downloads](https://nodejs.org/en/download). The existing ESLint dependency requires Node.js 20.19+, 22.13+, or 24+.
2. **k6:** follow the [official installation instructions](https://grafana.com/docs/k6/latest/set-up/install-k6/) for your OS.

| OS | k6 installation |
| --- | --- |
| macOS | With Homebrew installed: `brew install k6` |
| Windows | With Windows Package Manager: `winget install k6 --source winget`, or use the official installer linked above |
| Linux | Follow the Debian/Ubuntu or Fedora instructions linked above, or download the standalone binary |

Make sure all three commands work in a new terminal:

```sh
node --version
npm --version
k6 version
```

Git is optional: clone the repository or download and extract a ZIP. You also need network access to the API and test credentials. npm installs the project dependencies; it does not install Node.js or k6.

## Install dependencies and build

```sh
npm ci
npm run build:tests
```

This discovers all `.ts` files under `tests/`, excluding `.d.ts` declarations, and bundles each into `dist/tests/`. Nested folders are preserved. For example, `tests/login-test-scenarios.ts` becomes `dist/tests/login-test-scenarios.js`. Add a new test under `tests/` without changing `package.json`.

Rebuild after changing a test or its imported helpers. esbuild is installed by `npm ci`; no global bundler installation is needed. The build and run scripts use project-relative paths for macOS, Linux, and Windows. `npm run build` still compiles the reusable helpers separately.

Run any generated test directly with k6, supplying its required environment variables:

```sh
k6 run dist/tests/rest-example-test.js --vus 2 --iterations 2
```

## Run login scenarios

Replace the example API URL and credentials below with your test values. These single-line commands work in Bash, Zsh, PowerShell, and Windows Command Prompt. In PowerShell, use `npm.cmd` if your execution policy blocks `npm.ps1`.

### Valid login

```sh
npm run test:login-scenarios -- --vus 2 --iterations 2 -e LOGIN_MODE=valid -e REST_BASE_URL="https://your-api-host" -e LOGIN_EMAIL="valid-user@example.com" -e LOGIN_PASSWORD="replace-with-test-password"
```

### Invalid login

```sh
npm run test:login-scenarios -- --vus 2 --iterations 2 -e LOGIN_MODE=invalid -e REST_BASE_URL="https://your-api-host" -e INVALID_LOGIN_EMAIL="invalid@example.test" -e INVALID_LOGIN_PASSWORD="incorrect-password"
```

### Valid and invalid login together

```sh
npm run test:login-scenarios -- --vus 2 --iterations 2 -e LOGIN_MODE=mixed -e REST_BASE_URL="https://your-api-host" -e LOGIN_EMAIL="valid-user@example.com" -e LOGIN_PASSWORD="replace-with-test-password" -e INVALID_LOGIN_EMAIL="invalid@example.test" -e INVALID_LOGIN_PASSWORD="incorrect-password"
```

The `--` forwards the remaining arguments from npm to k6. `--iterations 2` means two total iterations across the virtual users. Each mixed iteration sends one valid request followed by one invalid request, so the mixed example sends four requests in total. Every VU uses the supplied credentials.

For a duration-based run, replace `--iterations 2` with `--duration 30s`. Do not combine those two flags. The test sleeps for one second after each iteration.

| Variable | Purpose |
| --- | --- |
| `REST_BASE_URL` | Required API base URL; requests go to `/api/v1/auth/login` |
| `LOGIN_MODE` | `valid`, `invalid`, or `mixed`; defaults to `mixed` |
| `LOGIN_EMAIL`, `LOGIN_PASSWORD` | Required for valid and mixed modes |
| `INVALID_LOGIN_EMAIL`, `INVALID_LOGIN_PASSWORD` | Required for invalid and mixed modes |
| `INVALID_EXPECTED_STATUS` | Expected rejection status, defaults to `401`; must be a 4xx code |

Valid logins must return `202`. If the API rejects invalid credentials with `400`, add `-e INVALID_EXPECTED_STATUS=400`.

Use test credentials and keep real credentials out of source files. Command-line values can appear in shell history; use your shell or CI environment variables when appropriate. The scenarios test does not log credentials or response bodies.

## Read the metrics

The summary separates valid and invalid traffic using `login_type` tags:

| Metric | Meaning |
| --- | --- |
| `http_req_duration` | Request duration with average, median, p90, p95, and maximum |
| `http_req_failed` | Rate of unexpected HTTP responses |
| `http_reqs` | Request count and average requests per second |
| `checks` | Rate of responses matching the expected status |

The untagged row combines both login types. Tagged rows show each type separately. An invalid login returning its configured rejection status counts as expected, so it does not increase `http_req_failed`. Threshold failures cause k6 to exit with a nonzero code. Timing thresholds only expose the tagged summary rows; they do not enforce a response-time target.

Two iterations verify basic behavior. Use a larger run to assess performance reliably.

## Original login test

Build all tests, then run the original valid-login test:

```sh
npm run build:tests
npm run test:login -- --vus 2 --iterations 2 -e REST_BASE_URL="https://your-api-host" -e LOGIN_EMAIL="valid-user@example.com" -e LOGIN_PASSWORD="replace-with-test-password"
```

## Development checks

```sh
npx tsc --noEmit
```

This checks `src/`. To check the scenarios test as well:

```sh
npx tsc --ignoreConfig --noEmit --strict --target ES2020 --module ESNext --moduleResolution Bundler --esModuleInterop --skipLibCheck --types k6 tests/login-test-scenarios.ts
```

`npm test` is currently a placeholder. Use the named login scripts above. Generated bundles and `node_modules/` are ignored by Git.
