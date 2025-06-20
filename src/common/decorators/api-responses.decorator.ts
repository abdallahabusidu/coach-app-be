import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
  PaginatedResponseDto,
} from '../dtos/common-response.dto';

/**
 * Standard success response decorators
 */
export const ApiSuccessResponse = (description: string, type?: Type) => {
  const decorators = [
    ApiOkResponse({
      description,
      ...(type && { type }),
    }),
  ];

  return applyDecorators(...decorators);
};

export const ApiCreatedSuccessResponse = (description: string, type?: Type) => {
  const decorators = [
    ApiCreatedResponse({
      description,
      ...(type && { type }),
    }),
  ];

  return applyDecorators(...decorators);
};

/**
 * Paginated response decorator
 */
export const ApiPaginatedResponse = <TModel extends Type>(
  model: TModel,
  description: string = 'Paginated results',
) => {
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Standard error response decorators
 */
export const ApiStandardErrorResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
      type: ValidationErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Authentication required',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      type: ErrorResponseDto,
    }),
  );
};

/**
 * CRUD operation standard responses
 */
export const ApiCrudResponses = (entityName: string, entityType?: Type) => {
  return applyDecorators(
    ApiSuccessResponse(`${entityName} retrieved successfully`, entityType),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      type: ErrorResponseDto,
    }),
    ApiStandardErrorResponses(),
  );
};

export const ApiCreateResponses = (entityName: string, entityType?: Type) => {
  return applyDecorators(
    ApiCreatedSuccessResponse(`${entityName} created successfully`, entityType),
    ApiConflictResponse({
      description: `${entityName} already exists`,
      type: ErrorResponseDto,
    }),
    ApiStandardErrorResponses(),
  );
};

export const ApiUpdateResponses = (entityName: string, entityType?: Type) => {
  return applyDecorators(
    ApiSuccessResponse(`${entityName} updated successfully`, entityType),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      type: ErrorResponseDto,
    }),
    ApiStandardErrorResponses(),
  );
};

export const ApiDeleteResponses = (entityName: string) => {
  return applyDecorators(
    ApiSuccessResponse(`${entityName} deleted successfully`),
    ApiNotFoundResponse({
      description: `${entityName} not found`,
      type: ErrorResponseDto,
    }),
    ApiStandardErrorResponses(),
  );
};

/**
 * Authentication required responses
 */
export const ApiAuthResponses = () => {
  return applyDecorators(
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing authentication token',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
    }),
  );
};

/**
 * File upload responses
 */
export const ApiFileUploadResponses = () => {
  return applyDecorators(
    ApiSuccessResponse('File uploaded successfully'),
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid file format or size',
      type: ErrorResponseDto,
    }),
    ApiStandardErrorResponses(),
  );
};
