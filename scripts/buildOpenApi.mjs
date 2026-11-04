/**
 * Publishes the developer API description as public/developers/openapi.json
 * (served at https://www.getspurly.com/developers/openapi.json) so partners can
 * import it into Postman or generate a client. The source of truth is
 * src/products/pages/developers/openapi.js; the JSON is generated and
 * git-ignored. Runs with the content build (predev / prebuild / pretest).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'src/products/pages/developers/openapi.js');
const OUT = path.join(ROOT, 'public/developers/openapi.json');
const OUT_V2 = path.join(ROOT, 'public/developers/openapi.v2.json');

export async function buildOpenApi({ quiet = false } = {}) {
  const { OPENAPI, operations } = await import(pathToFileURL(SOURCE).href);
  const { OPENAPI_V2 } = await import(pathToFileURL(SOURCE.replace('openapi.js', 'openapi.v2.js')).href);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(OPENAPI, null, 2)}\n`);
  fs.writeFileSync(OUT_V2, `${JSON.stringify(OPENAPI_V2, null, 2)}\n`);
  if (!quiet) console.log(`[openapi] ${operations().length} v1 + ${operations('v2').length} v2 operations -> public/developers/openapi*.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildOpenApi();
