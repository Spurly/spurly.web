---
title: OpenAPI specification
navTitle: OpenAPI spec
description: Download the OpenAPI 3.1 description of the Spurly LinkedIn API to import into Postman or generate a client library.
path: /developers/openapi
template: docs
section: Resources
order: 1
date: 2026-10-24
parent: /developers
---
The whole API, including webhook payloads, is described in one OpenAPI 3.1 file. These docs are generated from it, so it always matches them.

::download

## Postman

1. In Postman, choose **Import**, then **Link**.
2. Paste `https://www.getspurly.com/developers/openapi.json` and import it as a collection.
3. In the collection's **Authorization** tab, choose Bearer Token and paste your API key.

## Generate a client

Any OpenAPI 3.1 generator works. For example, TypeScript types with `openapi-typescript`:

```bash
npx openapi-typescript https://www.getspurly.com/developers/openapi.json -o spurly.d.ts
```

Or a Python client with `openapi-python-client`:

```bash
pipx run openapi-python-client generate --url https://www.getspurly.com/developers/openapi.json
```
