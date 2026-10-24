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

export async function buildOpenApi({ quiet = false } = {}) {
  const { OPENAPI, operations } = await import(pathToFileURL(SOURCE).href);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(OPENAPI, null, 2)}\n`);
  if (!quiet) console.log(`[openapi] ${operations().length} operations -> public/developers/openapi.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildOpenApi();
