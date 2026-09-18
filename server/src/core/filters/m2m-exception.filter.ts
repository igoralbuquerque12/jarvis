import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  M2mErrorBody,
  M2mErrorCode,
  M2mValidationException,
} from '../errors/m2m.errors';

/**
 * Applied with `@UseFilters` on the M2M controllers. Whatever is thrown
 * (DTO validation, Prisma, Securo, WhatsApp, plain Error) leaves the
 * endpoint as `{ error: { code, message, fields? } }` with the matching
 * HTTP status. The model only ever sees this shape.
 */
@Catch()
export class M2mExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(M2mExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.translate(exception);

    if (status >= 500) {
      this.logger.error(
        'Unhandled M2M error',
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private translate(exception: unknown): {
    status: number;
    body: M2mErrorBody;
  } {
    if (exception instanceof M2mValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          error: {
            code: 'validation_error',
            message: 'Alguns campos são inválidos.',
            fields: exception.fields,
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const explicitCode = this.readCode(payload);
      const message = this.readMessage(payload, exception.message);

      return {
        status,
        body: {
          error: {
            code: explicitCode ?? this.codeForStatus(status),
            message,
          },
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        error: {
          code: 'internal_error',
          message: 'Falha interna ao executar a operação.',
        },
      },
    };
  }

  private codeForStatus(status: number): M2mErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'validation_error';
      case HttpStatus.NOT_FOUND:
        return 'not_found';
      case HttpStatus.CONFLICT:
        return 'conflict';
      case HttpStatus.SERVICE_UNAVAILABLE:
      case HttpStatus.GATEWAY_TIMEOUT:
        return 'unavailable';
      default:
        return 'internal_error';
    }
  }

  private readCode(payload: unknown): M2mErrorCode | null {
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      typeof payload.code === 'string'
    ) {
      return payload.code as M2mErrorCode;
    }

    return null;
  }

  private readMessage(payload: unknown, fallback: string): string {
    if (typeof payload === 'string') {
      return payload;
    }

    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const message = payload.message;

      if (Array.isArray(message)) {
        return message.map(String).join('; ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }
}
