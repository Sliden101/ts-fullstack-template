import { z } from "zod"

export type SignInMessages = {
  emailRequired: string
  emailInvalid: string
  passwordRequired: string
  passwordTooShort: string
}

export function createSignInSchema(messages: SignInMessages) {
  return z.object({
    email: z
      .string()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid),
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .min(8, messages.passwordTooShort),
  })
}

export type SignInFormValues = z.infer<ReturnType<typeof createSignInSchema>>
