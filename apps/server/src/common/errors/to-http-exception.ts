import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { DomainError } from '../../domain/shared/errors.ts';

export function toHttpException(error: DomainError): HttpException {
  const body = { code: error.code, message: error.message };

  switch (error.statusCode) {
    case 401:
      return new UnauthorizedException(body);
    case 403:
      return new ForbiddenException(body);
    case 404:
      return new NotFoundException(body);
    case 409:
      return new ConflictException(body);
    case 500:
      return new InternalServerErrorException(body);
    default:
      return new BadRequestException(body);
  }
}
