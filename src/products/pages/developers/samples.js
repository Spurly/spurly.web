import { OPENAPI, resolveRef } from "./openapi.js";

/* Code samples generated from the spec: one source, so a sample can never
   drift from the endpoint it documents. curl, Node.js (built-in fetch, Node 18+)
   and Python (requests). */

export const SERVER = OPENAPI.servers[0].url;

function paramsOf(op) {
  return (op.parameters || []).map(resolveRef).filter(Boolean);
}

/** The example request body: `example`, else the first of `examples`. */
export function bodyExample(op) {
  const content = op.requestBody?.content;
  if (!content) return null;
  const json = content["application/json"];
  if (json) return json.example ?? Object.values(json.examples || {})[0]?.value ?? null;
  return null;
}

export function isBinaryUpload(op) {
  return Boolean(op.requestBody?.content?.["application/octet-stream"]);
}

export function isBinaryDownload(op) {
  return Boolean(op.responses?.["200"]?.content?.["application/octet-stream"]);
}

function urlFor(op) {
  let path = op.path;
  const query = [];
  for (const p of paramsOf(op)) {
    if (p.in === "path") path = path.replace(`{${p.name}}`, encodeURIComponent(p.example ?? `<${p.name}>`));
    if (p.in === "query" && p.example !== undefined) query.push(`${p.name}=${encodeURIComponent(p.example)}`);
  }
  return `${SERVER}${path}${query.length ? `?${query.join("&")}` : ""}`;
}

const indent = (text, pad) => text.split("\n").map((l, i) => (i === 0 ? l : pad + l)).join("\n");

function curl(op) {
  const method = op.method.toUpperCase();
  const lines = [`curl${method === "GET" ? "" : ` -X ${method}`} "${urlFor(op)}"`, `  -H "Authorization: Bearer $SPURLY_API_KEY"`];
  const body = bodyExample(op);
  if (isBinaryUpload(op)) {
    const file = op.requestBody["x-file"] || { name: "file.pdf", type: "application/pdf" };
    lines.push(`  -H "Content-Type: ${file.type}"`, `  --data-binary @${file.name}`);
  } else if (body) {
    lines.push(`  -H "Content-Type: application/json"`, `  -d '${JSON.stringify(body)}'`);
  }
  if (isBinaryDownload(op)) lines.push("  -o attachment.bin");
  return lines.join(" \\\n");
}

function node(op) {
  const method = op.method.toUpperCase();
  const body = bodyExample(op);
  const out = [];
  if (isBinaryUpload(op)) {
    const file = op.requestBody["x-file"] || { name: "file.pdf", type: "application/pdf" };
    out.push(`import { readFile } from "node:fs/promises";`, "");
    out.push(`const res = await fetch("${urlFor(op)}", {`);
    out.push(`  method: "${method}",`);
    out.push(`  headers: {`, `    Authorization: \`Bearer \${process.env.SPURLY_API_KEY}\`,`, `    "Content-Type": "${file.type}",`, `  },`);
    out.push(`  body: await readFile("${file.name}"),`, `});`);
  } else {
    out.push(`const res = await fetch("${urlFor(op)}", {`);
    if (method !== "GET") out.push(`  method: "${method}",`);
    out.push(`  headers: {`, `    Authorization: \`Bearer \${process.env.SPURLY_API_KEY}\`,`);
    if (body) out.push(`    "Content-Type": "application/json",`);
    out.push(`  },`);
    if (body) out.push(`  body: JSON.stringify(${indent(JSON.stringify(body, null, 2), "  ")}),`);
    out.push(`});`);
  }
  if (isBinaryDownload(op)) {
    out.push(`if (!res.ok) throw new Error((await res.json()).message);`, `const file = Buffer.from(await res.arrayBuffer());`);
  } else {
    out.push(`const { success, data, message, code } = await res.json();`, `if (!success) throw new Error(\`\${code}: \${message}\`);`);
  }
  return out.join("\n");
}

function pyLiteral(value, pad = "") {
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return value.length ? `[${value.map((v) => pyLiteral(v, pad)).join(", ")}]` : "[]";
  const entries = Object.entries(value);
  if (!entries.length) return "{}";
  const inner = pad + "    ";
  return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${pyLiteral(v, inner)}`).join(",\n")},\n${pad}}`;
}

function python(op) {
  const method = op.method.toLowerCase();
  const body = bodyExample(op);
  const out = ["import os", "import requests", ""];
  const args = [`    "${urlFor(op)}"`, `    headers={"Authorization": f"Bearer {os.environ['SPURLY_API_KEY']}"${isBinaryUpload(op) ? `, "Content-Type": "${(op.requestBody["x-file"] || {}).type || "application/pdf"}"` : ""}}`];
  if (isBinaryUpload(op)) args.push(`    data=open("${(op.requestBody["x-file"] || {}).name || "file.pdf"}", "rb")`);
  else if (body) args.push(`    json=${pyLiteral(body, "    ")}`);
  args.push("    timeout=30");
  out.push(`res = requests.${method}(\n${args.join(",\n")},\n)`);
  if (isBinaryDownload(op)) out.push("res.raise_for_status()", "content = res.content");
  else out.push("body = res.json()", "if not body[\"success\"]:", "    raise RuntimeError(f\"{body['code']}: {body['message']}\")", "data = body[\"data\"]");
  return out.join("\n");
}

export const LANGUAGES = [
  { id: "curl", label: "curl", lang: "bash", build: curl },
  { id: "node", label: "Node.js", lang: "js", build: node },
  { id: "python", label: "Python", lang: "python", build: python },
];

export function samplesFor(op) {
  return LANGUAGES.map((l) => ({ ...l, code: l.build(op) }));
}
