export function toErrorMessages(errors: unknown[]): string[] {
  return errors.flatMap((error) => {
    if (error == null) return [];
    if (typeof error === 'string') return [error];
    if (typeof error === 'object' && 'message' in error) {
      const { message } = error as { message?: unknown };
      return typeof message === 'string' ? [message] : [];
    }
    return [];
  });
}
