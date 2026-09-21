export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly statusCode: number;
}

export function domainError(
  code: string,
  message: string,
  statusCode: number,
): DomainError {
  return { code, message, statusCode };
}
