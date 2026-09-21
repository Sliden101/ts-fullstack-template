import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { FastifyRequest } from 'fastify';
import { auth } from '../../auth.ts';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.ts';
import { UpdateUserSchema } from '../users/users.schemas.ts';
import type { UpdateUserInput } from '../users/users.schemas.ts';
import type { PublicUser } from '../users/users.service.ts';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  banned?: boolean | null;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  createdAt: Date;
};

type AuthenticatedRequest = FastifyRequest & {
  user?: SessionUser | null;
};

export type SelfUser = Omit<PublicUser, 'banned'>;

export function toSelfUser(user: SessionUser): SelfUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? 'user',
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    image: user.image ?? null,
    createdAt: user.createdAt,
  };
}

@Controller('api/me')
export class MeController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService<typeof auth>,
  ) {}

  @Get()
  getMe(@Req() req: AuthenticatedRequest): { user: SelfUser } {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return { user: toSelfUser(req.user) };
  }

  @Patch()
  async updateMe(
    @Body(
      new ZodValidationPipe(UpdateUserSchema, {
        forbiddenKeys: ['role', 'email', 'password'],
      }),
    )
    input: UpdateUserInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: SelfUser }> {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    await this.authService.api.updateUser({
      body: input,
      headers: fromNodeHeaders(req.headers),
    });

    return { user: toSelfUser({ ...req.user, ...input }) };
  }
}
