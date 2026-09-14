import { Transform } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * n8n tools send `data` either as an object or as a JSON string (the
 * `$fromAI` "json" type rejects empty objects, so the RPC tools send a
 * string). Accept both; an unparsable string is left as-is so `@IsObject`
 * produces a clear validation error the model can read and fix.
 */
function parseData(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export class ExecuteOperationDto {
  @IsString()
  operation: string;

  @IsOptional()
  @Transform(({ value }) => parseData(value))
  @IsObject({ message: 'data must be a JSON object (or a JSON string of one)' })
  data?: Record<string, unknown>;
}
