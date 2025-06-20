import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API response wrapper
 */
export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Request success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Error details' })
  error?: string;

  @ApiPropertyOptional({ description: 'Timestamp of the response' })
  timestamp?: string;
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items', isArray: true })
  items: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrevious: boolean;
}

/**
 * Standard success response
 */
export class SuccessResponseDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Success status', default: true })
  success: boolean = true;
}

/**
 * Standard error response
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Error code' })
  error: string;

  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Timestamp of the error' })
  timestamp: string;

  @ApiProperty({ description: 'Request path' })
  path: string;
}

/**
 * Validation error response
 */
export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Validation error details',
    type: [String],
    example: ['name should not be empty', 'email must be a valid email'],
  })
  details: string[];
}

/**
 * Standard query parameters for pagination
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  limit?: number = 20;
}

/**
 * Standard query parameters for sorting
 */
export class SortingQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * Combined pagination and sorting query parameters
 */
export class PaginationSortingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * ID parameter validation
 */
export class IdParamDto {
  @ApiProperty({
    description: 'Resource UUID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
}
