import { z } from 'zod';

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInputSchema = z.infer<typeof LoginInputSchema>;

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly roles: string[];
  readonly permissions: string[];
}
