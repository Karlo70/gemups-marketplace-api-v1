import { UnprocessableEntityException, ValidationError } from '@nestjs/common';
import { errorMessageFormatter } from './error-message-formatter';

// Recursive function to extract and format nested errors
const extractErrors = (errors: ValidationError[]): any => {
  const formattedErrors: Record<string, any> = {};

  for (const error of errors) {
    if (error.children && error.children.length > 0) {
      const childErrors = extractErrors(error.children);
      if (Object.keys(childErrors).length > 0) {
        formattedErrors[error.property] = childErrors;
      }
    } else if (error.constraints) {
      const [_, value] = Object.entries(error.constraints)[0];
      try {
        const parsed = JSON.parse(value);
        formattedErrors[error.property] = parsed;
      } catch {
        formattedErrors[error.property] = errorMessageFormatter(value);
      }
    }
  }

  return formattedErrors;
};

export const validationExceptionFormatter = (errors: ValidationError[]) => {
  const formattedErrors = extractErrors(errors);
  return new ValidationException(formattedErrors);
};

export class ValidationException extends UnprocessableEntityException {
  constructor(public validationErrors: Record<string, unknown>) {
    super(validationErrors);
  }
}
