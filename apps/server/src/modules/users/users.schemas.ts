import { z } from 'zod';

const profileFields = {
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  image: z.string().url().optional(),
};

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.string().min(1).optional(),
  ...profileFields,
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    ...profileFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const SetRoleSchema = z.object({
  role: z.string().min(1),
});

export type SetRoleInput = z.infer<typeof SetRoleSchema>;
