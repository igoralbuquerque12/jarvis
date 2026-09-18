import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

/**
 * Error contract every M2M (assistant-facing) endpoint follows:
 *
 *   { "error": { "code": M2mErrorCode, "message": string, "fields"?: {...} } }
 *
 * The codes are documented once in the assistant directive so the model
 * knows what to do with each one (retry once, list again, give up).
 */
export type M2mErrorCode =
  | 'validation_error'
  | 'not_found'
  | 'conflict'
  | 'unavailable'
  | 'unsupported_operation'
  | 'internal_error';

export type M2mFieldErrors = Record<string, string>;

export interface M2mErrorBody {
  error: {
    code: M2mErrorCode;
    message: string;
    fields?: M2mFieldErrors;
  };
}

/** Raised when the `data` of an operation fails validation. */
export class M2mValidationException extends BadRequestException {
  constructor(public readonly fields: M2mFieldErrors) {
    super({
      code: 'validation_error',
      message: 'Alguns campos são inválidos.',
      fields,
    });
  }

  static fromClassValidator(errors: ValidationError[]): M2mValidationException {
    return new M2mValidationException(flattenValidationErrors(errors));
  }
}

/** Raised when the model sends an operation name the tool does not have. */
export function unsupportedOperation(operation: string): BadRequestException {
  return new BadRequestException({
    code: 'unsupported_operation',
    message: `Operação "${operation}" não existe nesta ferramenta.`,
  });
}

function flattenValidationErrors(
  errors: ValidationError[],
  prefix = '',
): M2mFieldErrors {
  const fields: M2mFieldErrors = {};

  for (const error of errors) {
    const path = prefix ? `${prefix}.${error.property}` : error.property;

    if (error.constraints) {
      fields[path] = Object.values(error.constraints).join('; ');
    }

    if (error.children?.length) {
      Object.assign(fields, flattenValidationErrors(error.children, path));
    }
  }

  return fields;
}
