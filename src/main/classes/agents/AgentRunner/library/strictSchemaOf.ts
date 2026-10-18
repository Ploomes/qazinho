type Schema = { [key: string]: unknown };

/** A JSON Schema the way OpenAI's strict mode takes it: every field required, the optional ones nullable. */
export function strictSchemaOf(schema: Schema): Schema {
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
