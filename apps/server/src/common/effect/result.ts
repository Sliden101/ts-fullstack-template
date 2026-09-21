import { Effect } from 'effect';
import type { Result } from '../../domain/shared/result.ts';

export function fromResult<T, E>(result: Result<T, E>): Effect.Effect<T, E> {
  return result.ok ? Effect.succeed(result.value) : Effect.fail(result.error);
}
