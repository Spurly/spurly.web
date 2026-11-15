import { OPENAPI, operationById } from "./openapi.js";
import Endpoint, { endpointAnchor, endpointsWithTag } from "./Endpoint.jsx";
import SchemaTable, { objectAnchor } from "./SchemaTable.jsx";
import CodeBlock from "./CodeBlock.jsx";
import InlineText from "./Inline.jsx";

/* Renderers for the `::name arg` directives in docs pages, and the headings
   they contribute to the "On this page" list. */

/** The /v2 spec prefixes its object names with "V2" so a `$ref` is unambiguous; readers never see it. */
export const displayName = (name) => (/^V2[A-Z]/.test(name) ? name.slice(2) : name);

function SchemaBlock({ name }) {
  const schema = OPENAPI.components.schemas[name];
  if (!schema) return <p className="docs-note">Unknown object: {name}</p>;
  const shown = displayName(name);
  return (
    <section className="docs-object" id={objectAnchor(name)}>
      <h2>{shown}</h2>
      {schema.description && <p><InlineText text={schema.description} /></p>}
      <SchemaTable schema={schema} />
      {schema.example && <CodeBlock code={JSON.stringify(schema.example, null, 2)} lang="json" title={`${shown} example`} />}
    </section>
  );
}

function Download() {
  return (
    <div className="docs-download">
      <div>
        <strong>OpenAPI 3.1 description</strong>
        <p>Every endpoint, parameter, response and webhook in one file. Import it into Postman (Import, then Link) or generate a client with any OpenAPI generator.</p>
      </div>
      <a className="btn btn-primary" href="/developers/openapi.v2.json" download>Download openapi.v2.json</a>
    </div>
  );
}

export function Embed({ block }) {
  switch (block.name) {
    case "endpoint":
      return <Endpoint operationId={block.arg} />;
    case "endpoints":
      return endpointsWithTag(block.arg).map((op) => <Endpoint key={op.operationId} operationId={op.operationId} />);
    case "schema":
      return <SchemaBlock name={block.arg} />;
    case "download":
      return <Download />;
    default:
      return null;
  }
}

/** Table-of-contents entries for a block: [{ id, label, depth }]. */
export function tocFor(block) {
  if (block.type === "h2") return [{ id: block.id, label: block.inline, depth: 2 }];
  if (block.type !== "embed") return [];
  if (block.name === "endpoint") {
    const op = operationById(block.arg);
    return op ? [{ id: endpointAnchor(op), text: op.summary, depth: 2 }] : [];
  }
  if (block.name === "endpoints") return endpointsWithTag(block.arg).map((op) => ({ id: endpointAnchor(op), text: op.summary, depth: 2 }));
  if (block.name === "schema") return [{ id: objectAnchor(block.arg), text: displayName(block.arg), depth: 2 }];
  return [];
}
