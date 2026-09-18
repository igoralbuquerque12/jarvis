/**
 * Prints the JSON schema of every assistant tool.
 *
 *   npm run tools:schemas            # all tools
 *   npm run tools:schemas -- events  # one tool
 *
 * Paste each schema into the matching n8n tool node ("Call n8n Workflow
 * Tool" → Input schema → "Define using JSON Schema", or the MCP tool
 * definition). Re-run whenever a tool or operation changes.
 */
import { ASSISTANT_TOOLS } from '../src/assistant/tools/main.tools';
import { buildToolSchemas } from '../src/assistant/utils/build-tool-schemas';

const wanted = process.argv[2];
const schemas = buildToolSchemas(ASSISTANT_TOOLS).filter(
  (schema) => !wanted || schema.name === wanted,
);

if (schemas.length === 0) {
  console.error(
    `Tool "${wanted}" not found. Available: ${ASSISTANT_TOOLS.map((t) => t.name).join(', ')}`,
  );
  process.exit(1);
}

console.log(JSON.stringify(schemas, null, 2));
