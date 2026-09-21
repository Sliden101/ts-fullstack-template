import { Scalar, type CustomScalar } from '@nestjs/graphql';
import { Kind, type ValueNode } from 'graphql';

@Scalar('Date', () => Date)
export class DateScalar implements CustomScalar<string, Date> {
  description = 'ISO-8601 date-time';
  parseValue(value: unknown): Date {
    return new Date(value as string);
  }
  serialize(value: unknown): string {
    return new Date(value as string).toISOString();
  }
  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new TypeError('Date must be a string');
  }
}

@Scalar('Time', () => String)
export class TimeScalar implements CustomScalar<string, string> {
  description = 'HH:mm time';
  parseValue(value: unknown): string {
    return String(value);
  }
  serialize(value: unknown): string {
    return String(value);
  }
  parseLiteral(ast: ValueNode): string {
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    throw new TypeError('Time must be a string');
  }
}
