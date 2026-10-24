import { OPENAPI, operationById, resolveRef } from "./openapi.js";
import { samplesFor } from "./samples.js";
import SchemaTable from "./SchemaTable.jsx";
import CodeBlock, { CodeTabs } from "./CodeBlock.jsx";
import InlineText from "./Inline.jsx";

/* One endpoint, rendered entirely from the OpenAPI spec: method and path,
   description, parameters, request body, code samples, every response. */

export const endpointAnchor = (op) => op.operationId.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function ParamsTable({ params }) {
  if (!params.length) return null;
  return (
    <div className="content-table docs-fields">
      <table>
        <thead>
          <tr><th scope="col">Parameter</th><th scope="col">In</th><th scope="col">Type</th><th scope="col">Description</th></tr>
        </thead>
        <tbody>
          {params.map((p) => {
            const s = p.schema || {};
            const extra = [
              Array.isArray(s.enum) ? `One of ${s.enum.map((v) => `\`${v}\``).join(", ")}.` : "",
              s.default !== undefined ? `Default \`${s.default}\`.` : "",
              s.maximum !== undefined ? `Up to ${s.maximum}.` : "",
            ].filter(Boolean).join(" ");
            return (
              <tr key={`${p.in}-${p.name}`}>
                <th scope="row"><code>{p.name}</code>{p.required && <span className="docs-req">required</span>}</th>
                <td>{p.in}</td>
                <td><code>{[].concat(s.type || "string").join(" or ")}</code></td>
                <td><InlineText text={p.description || ""} /> <InlineText text={extra} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function responseExample(response) {
  const content = response?.content?.["application/json"];
  if (!content) return null;
  if (content.example !== undefined) return content.example;
  const first = Object.values(content.examples || {})[0];
  return first ? first.value : null;
}

function Responses({ op }) {
  const entries = Object.entries(op.responses || {});
  return (
    <div className="docs-responses">
      {entries.map(([status, raw]) => {
        const response = resolveRef(raw);
        const example = responseExample(response);
        const ok = String(status).startsWith("2");
        return (
          <details key={status} className="docs-response" open={ok}>
            <summary>
              <span className={`docs-status ${ok ? "ok" : "err"}`}>{status}</span>
              <span><InlineText text={response?.description || ""} /></span>
            </summary>
            {example !== null && example !== undefined && <CodeBlock code={JSON.stringify(example, null, 2)} lang="json" title="Response" />}
            {response?.content?.["application/octet-stream"] && <p className="docs-note">The raw file, with its own <code>Content-Type</code>.</p>}
          </details>
        );
      })}
    </div>
  );
}

export default function Endpoint({ operationId }) {
  const op = operationById(operationId);
  if (!op) return <p className="docs-note">Unknown endpoint: {operationId}</p>;
  const params = (op.parameters || []).map(resolveRef).filter(Boolean);
  const body = op.requestBody?.content?.["application/json"];
  const binary = op.requestBody?.content?.["application/octet-stream"];
  return (
    <section className="docs-endpoint" id={endpointAnchor(op)} aria-labelledby={`${endpointAnchor(op)}-title`}>
      <h2 id={`${endpointAnchor(op)}-title`}>{op.summary}</h2>
      <p className="docs-route">
        <span className={`docs-method m-${op.method}`}>{op.method.toUpperCase()}</span>
        <code>{op.path}</code>
      </p>
      {op.description && <p><InlineText text={op.description} /></p>}

      {params.length > 0 && (
        <>
          <h3>Parameters</h3>
          <ParamsTable params={params} />
        </>
      )}

      {body && (
        <>
          <h3>Request body</h3>
          <SchemaTable schema={body.schema} showRequired />
        </>
      )}
      {binary && (
        <>
          <h3>Request body</h3>
          <p>The raw file bytes. Set <code>Content-Type</code> to the file&apos;s type.</p>
        </>
      )}

      <h3>Example request</h3>
      <CodeTabs samples={samplesFor(op)} label={`${op.summary} example`} />

      <h3>Responses</h3>
      <Responses op={op} />
    </section>
  );
}

export const tagSlug = (tag) => tag.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Every endpoint whose tag matches (by name or slug, "linkedin-connection"), in spec order. */
export function endpointsWithTag(tag) {
  const out = [];
  for (const [path, item] of Object.entries(OPENAPI.paths)) {
    for (const method of ["get", "post", "put", "patch", "delete"]) {
      if (item[method]?.tags?.some((t) => t === tag || tagSlug(t) === tag)) out.push({ path, method, ...item[method] });
    }
  }
  return out;
}
