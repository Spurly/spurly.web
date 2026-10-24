import { OPENAPI, resolveRef } from "./openapi.js";
import Endpoint, { endpointAnchor, endpointsWithTag } from "./Endpoint.jsx";
import SchemaTable, { objectAnchor } from "./SchemaTable.jsx";
import CodeBlock from "./CodeBlock.jsx";
import InlineText from "./Inline.jsx";

/* Renderers for the `::name arg` directives in docs pages, and the headings
   they contribute to the "On this page" list. */

function SchemaBlock({ name }) {
  const schema = OPENAPI.components.schemas[name];
  if (!schema) return <p className="docs-note">Unknown object: {name}</p>;
  return (
    <section className="docs-object" id={objectAnchor(name)}>
      <h2>{name}</h2>
      {schema.description && <p><InlineText text={schema.description} /></p>}
      <SchemaTable schema={schema} />
      {schema.example && <CodeBlock code={JSON.stringify(schema.example, null, 2)} lang="json" title={`${name} example`} />}
    </section>
  );
}

function EventBlock({ type }) {
  const op = OPENAPI.webhooks[type]?.post;
  if (!op) return <p className="docs-note">Unknown event: {type}</p>;
  const content = op.requestBody.content["application/json"];
  const schema = resolveRef(content.schema);
  const dataSchema = schema.properties?.data;
  return (
    <section className="docs-object" id={type.replace(".", "-")}>
      <h2><code>{type}</code></h2>
      <p><InlineText text={op.description} /></p>
      {dataSchema?.properties && (
        <>
          <h3>data</h3>
          <SchemaTable schema={dataSchema} />
        </>
      )}
      <CodeBlock code={JSON.stringify(content.example, null, 2)} lang="json" title="Payload" />
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
      <a className="btn btn-primary" href="/developers/openapi.json" download>Download openapi.json</a>
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
    case "event":
      return <EventBlock type={block.arg} />;
    case "events":
      return Object.keys(OPENAPI.webhooks).map((t) => <EventBlock key={t} type={t} />);
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
    const op = Object.values(OPENAPI.paths).flatMap((p) => Object.values(p)).find((o) => o?.operationId === block.arg);
    return op ? [{ id: endpointAnchor(op), text: op.summary, depth: 2 }] : [];
  }
  if (block.name === "endpoints") return endpointsWithTag(block.arg).map((op) => ({ id: endpointAnchor(op), text: op.summary, depth: 2 }));
  if (block.name === "schema") return [{ id: objectAnchor(block.arg), text: block.arg, depth: 2 }];
  if (block.name === "event") return [{ id: block.arg.replace(".", "-"), text: block.arg, depth: 2 }];
  if (block.name === "events") return Object.keys(OPENAPI.webhooks).map((t) => ({ id: t.replace(".", "-"), text: t, depth: 2 }));
  return [];
}
