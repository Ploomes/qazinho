type Schema = { [key: string]: unknown };

const UNSURE_KEYWORDS = new Set(['minItems', 'maxItems']);

/** A JSON Schema the way OpenAI's strict mode takes it: every field required, the optional ones nullable, no array bounds. */
export function strictSchemaOf(given: Schema): Schema {
  const schema = Object.fromEntries(
    Object.entries(given).filter(([keyword]) => !UNSURE_KEYWORDS.has(keyword)),
  );
  const items = schema.items as Schema | undefined;
  const properties = schema.properties as Record<string, Schema> | undefined;

  if (properties === undefined)
    return items === undefined ? schema : { ...schema, items: strictSchemaOf(items) };

  const required = new Set((schema.required as string[] | undefined) ?? []);

  return {
    ...schema,
    additionalProperties: false,
    required: Object.keys(properties),
    properties: Object.fromEntries(
      Object.entries(properties).map(([name, property]) => [
        name,
        required.has(name)
          ? strictSchemaOf(property)
          : { anyOf: [strictSchemaOf(property), { type: 'null' }] },
      ]),
    ),
  };
}
