import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

/**
 * Middleware factory for validating request DTOs
 */
export function validateDto(dtoClass: any, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoInstance = plainToClass(dtoClass, req[source], { excludeExtraneousValues: true });
    
    const errors = await validate(dtoInstance);

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors,
      });
    }

    // Replace the request data with validated DTO instance
    req[source] = dtoInstance;
    next();
  };
}

/**
 * Format validation errors for API response
 */
function formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (error.constraints) {
      formatted[error.property] = Object.values(error.constraints);
    }
  });

  return formatted;
}

