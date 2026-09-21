import { describe, expect, it } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { domainError } from '../../../../src/domain/shared/errors.ts';
import { toHttpException } from '../../../../src/common/errors/to-http-exception.ts';

describe('toHttpException', () => {
  it('maps 401 to UnauthorizedException', () => {
    expect(toHttpException(domainError('A', 'x', 401))).toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('maps 403 to ForbiddenException', () => {
    expect(toHttpException(domainError('A', 'x', 403))).toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('maps 404 to NotFoundException', () => {
    expect(toHttpException(domainError('A', 'x', 404))).toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps 409 to ConflictException', () => {
    expect(toHttpException(domainError('A', 'x', 409))).toBeInstanceOf(
      ConflictException,
    );
  });

  it('maps 500 to InternalServerErrorException', () => {
    expect(toHttpException(domainError('A', 'x', 500))).toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('maps anything else to BadRequestException', () => {
    expect(toHttpException(domainError('A', 'x', 422))).toBeInstanceOf(
      BadRequestException,
    );
  });

  it('carries the code and message in the response body', () => {
    const exception = toHttpException(domainError('ROUTE_NOT_FOUND', 'nope', 404));

    expect(exception.getResponse()).toMatchObject({
      code: 'ROUTE_NOT_FOUND',
      message: 'nope',
    });
  });
});
