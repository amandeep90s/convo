import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

function documentEndpoint(summary: string, status: number) {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({
      status,
      description: 'Successful response',
      schema: {
        type: 'object',
        required: [
          'success',
          'statusCode',
          'message',
          'data',
          'timestamp',
          'path',
        ],
        properties: {
          success: { type: 'boolean', enum: [true] },
          statusCode: { type: 'integer', example: status },
          message: { type: 'string' },
          data: {},
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string' },
        },
      },
    }),
  );
}

export function ApiEndpoint(summary: string) {
  return documentEndpoint(summary, HttpStatus.OK);
}

export function ApiCreatedEndpoint(summary: string) {
  return documentEndpoint(summary, HttpStatus.CREATED);
}
