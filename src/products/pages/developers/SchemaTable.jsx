import { Link } from "react-router-dom";
import { resolveRef, refName } from "./openapi.js";
import InlineText from "./Inline.jsx";

/* A schema as a field table: name, type, description. Nested objects are
   flattened one level ("sync.chats"); a field that is another documented
   object links to it on the Objects page instead of repeating it. */

export const objectAnchor = (name) => name.toLowerCase();

function typeLabel(schema) {
  if (!schema) return "";
  const name = refName(schema);
  if (name) return { link: name };
  if (schema.type === "array") {
    const itemName = refName(schema.items);
    return itemName ? { prefix: "array of ", link: itemName } : `array of ${typeLabel(schema.items) || "any"}`;
  }
  const types = [].concat(schema.type || (schema.const !== undefined ? typeof schema.const : "any"));
  let label = types.map((t) => (t === "null" ? "null" : schema.format && t === "string" ? `string (${schema.format})` : t)).join(" or ");
  if (schema.const !== undefined) label = `${label}, always ${JSON.stringify(schema.const)}`;
  return label;
}

function TypeCell({ schema }) {
  const label = typeLabel(schema);
  if (typeof label === "string") return <code>{label}</code>;
  return (
    <code>
      {label.prefix || ""}
      <Link to={`/developers/objects#${objectAnchor(label.link)}`}>{label.link}</Link>
    </code>
  );
}

function constraints(schema) {
  const out = [];
  if (Array.isArray(schema.enum)) out.push(`One of ${schema.enum.filter((v) => v !== null).map((v) => `\`${v}\``).join(", ")}.`);
  if (schema.default !== undefined) out.push(`Default \`${JSON.stringify(schema.default)}\`.`);
  if (schema.minimum !== undefined || schema.maximum !== undefined) out.push(`${schema.minimum ?? ""}${schema.maximum !== undefined ? ` to ${schema.maximum}` : " or more"}.`);
  if (schema.maxLength !== undefined) out.push(`Up to ${schema.maxLength} characters.`);
  return out.join(" ");
}

export function flattenFields(schema, prefix = "", depth = 0) {
  const s = resolveRef(schema);
  if (!s?.properties) return [];
  const required = new Set(s.required || []);
  const rows = [];
  for (const [key, raw] of Object.entries(s.properties)) {
    const name = prefix + key;
    const field = raw.$ref ? raw : raw;
    rows.push({ name, schema: field, required: required.has(key) });
    const inline = !field.$ref && (field.type === "object" || (Array.isArray(field.type) && field.type.includes("object"))) && field.properties;
    if (inline && depth < 2) rows.push(...flattenFields(field, `${name}.`, depth + 1));
  }
  return rows;
}

export default function SchemaTable({ schema, showRequired = false }) {
  const rows = flattenFields(schema);
  if (!rows.length) return null;
  return (
    <div className="content-table docs-fields">
      <table>
        <thead>
          <tr>
            <th scope="col">Field</th>
            <th scope="col">Type</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const resolved = r.schema.$ref ? resolveRef(r.schema) : r.schema;
            const desc = r.schema.description || (r.schema.$ref ? resolved?.description : "") || "";
            return (
              <tr key={r.name}>
                <th scope="row">
                  <code>{r.name}</code>
                  {showRequired && r.required && <span className="docs-req">required</span>}
                </th>
                <td><TypeCell schema={r.schema} /></td>
                <td>
                  <InlineText text={desc} /> <InlineText text={constraints(r.schema)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
