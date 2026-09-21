import { z } from 'zod';

/** Permission strings use the `resource:action` format. */
export const PERMISSION_PATTERN = /^[a-z_]+:[a-z_-]+$/;

export const permissionSchema = z.string().regex(PERMISSION_PATTERN, {
  message: 'Permission must use the `resource:action` format',
});

/** The authenticated principal, as returned by the `me` query. */
export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  permissions: z.array(permissionSchema),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;
