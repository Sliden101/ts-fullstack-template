import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import type { FastifyRequest } from 'fastify';
import { AppAuthService } from './auth.service.ts';
import { AuthSessionInfo, AuthUser } from './auth.types.ts';

type GuardedUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
};

type GuardedRequest = FastifyRequest & {
  user?: GuardedUser | null;
  session?: { session?: { id?: string } } | null;
};

@Resolver()
export class AuthResolver {
  constructor(
    @Inject(AppAuthService) private readonly authService: AppAuthService,
  ) {}

  @OptionalAuth()
  @Query(() => AuthUser, { nullable: true })
  me(@Context('req') req: GuardedRequest): AuthUser | null {
    const user = req.user;
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? 'user',
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      image: user.image ?? null,
    };
  }

  @Query(() => [AuthSessionInfo])
  async mySessions(
    @Context('req') req: GuardedRequest,
  ): Promise<AuthSessionInfo[]> {
    const sessions = await this.authService.listSessions(req.headers);
    const currentId = req.session?.session?.id;

    return sessions.map((session) => ({
      id: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      isCurrent: session.id === currentId,
    }));
  }

  @Mutation(() => Boolean)
  async revokeSession(
    @Args('sessionId', { type: () => ID }) sessionId: string,
    @Context('req') req: FastifyRequest,
  ): Promise<boolean> {
    return this.authService.revokeSession(sessionId, req.headers);
  }
}
