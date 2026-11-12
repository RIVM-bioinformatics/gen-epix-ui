---
name: update-api
description: >-
  Check local Case DB, Sequence DB, and OMOP DB OpenAPI endpoints, regenerate
  the API clients, and validate the monorepo. Use when asked to update, refresh,
  regenerate, or validate API clients or generated API code.
---

# Update API Clients

Run this workflow from the repository root. Do not generate clients until all
three local OpenAPI endpoints return HTTP 200.

## A. Check the local OpenAPI endpoints

Check each URL and record its HTTP status:

```sh
curl --silent --show-error --output /dev/null --write-out '%{http_code}' --insecure --connect-timeout 2 --max-time 5 https://127.0.0.1:8000/openapi.json
curl --silent --show-error --output /dev/null --write-out '%{http_code}' --insecure --connect-timeout 2 --max-time 5 https://127.0.0.1:8001/openapi.json
curl --silent --show-error --output /dev/null --write-out '%{http_code}' --insecure --connect-timeout 2 --max-time 5 https://127.0.0.1:8002/openapi.json
```

The endpoints correspond to:

- Case DB: `https://127.0.0.1:8000/openapi.json`
- Sequence DB: `https://127.0.0.1:8001/openapi.json`
- OMOP DB: `https://127.0.0.1:8002/openapi.json`

Use `--insecure` only for these local endpoints, which may use a self-signed
certificate. A curl connection failure or any status other than `200` means the
check failed.

If any check fails:

1. Tell the user which endpoints did not return `200` and ask them to run
   `gen-epix-api` in `api.platform.local.mock.dict_demo` mode.
2. Offer **Try again** as an actionable choice. Do not continue to generation
   unless the user chooses it.
3. When the user chooses **Try again**, repeat all three checks from step A.
   Continue this gate until all endpoints return `200` or the user chooses not
   to retry.

## B. Generate the API clients

Only after all three endpoints return `200`, run:

```sh
pnpm run generate-api
```

If it fails, do not continue to validation. Report the failing command and the
relevant error output, identify the likely cause from that output and the
affected package or file, and guide the user through the specific corrective
steps. Do not claim generation succeeded or make speculative changes. Once the
problem is resolved, rerun generation and proceed only after it succeeds.

## C. Validate the monorepo

After generation succeeds, run:

```sh
pnpm run validate
```

If validation fails, report the failing package or check and the relevant error
output, then guide the user through targeted troubleshooting and corrective
steps. Distinguish failures caused by this API update from unrelated existing
failures, and do not claim validation succeeded unless the command passes.

When both commands succeed, summarize that API generation and validation
completed successfully.
