import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import type { FastifyRequest } from 'fastify';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.ts';
import { runGraphQL } from '../../common/effect/run.ts';
import { AppUsersService } from './users.service.ts';
import type { PublicUser } from './users.service.ts';
import {
  CreateUserSchema,
  SetRoleSchema,
  UpdateUserSchema,
} from './users.schemas.ts';
import type {
  CreateUserInput,
  SetRoleInput,
  UpdateUserInput,
} from './users.schemas.ts';

type AuthenticatedRequest = FastifyRequest & {
  user?: { id?: string } | null;
};

@Controller('api/users')
export class UsersController {
  constructor(
    @Inject(AppUsersService) private readonly usersService: AppUsersService,
  ) {}

  @UserHasPermission({ permission: { user: ['create'] } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) input: CreateUserInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: PublicUser }> {
    const user = await runGraphQL(
      this.usersService.create(input, req.user?.id),
    );
    return { user };
  }

  @UserHasPermission({ permission: { user: ['list'] } })
  @Get()
  async list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ users: PublicUser[]; total: number }> {
    return runGraphQL(
      this.usersService.list(
        limit ? Number(limit) : undefined,
        offset ? Number(offset) : undefined,
      ),
    );
  }

  @UserHasPermission({ permission: { user: ['get'] } })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<{ user: PublicUser }> {
    const user = await runGraphQL(this.usersService.findById(id));
    return { user };
  }

  @UserHasPermission({ permission: { user: ['update'] } })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) input: UpdateUserInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: PublicUser }> {
    const user = await runGraphQL(
      this.usersService.update(id, input, req.user?.id),
    );
    return { user };
  }

  @UserHasPermission({ permission: { user: ['set-role'] } })
  @Post(':id/role')
  @HttpCode(HttpStatus.OK)
  async setRole(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetRoleSchema)) input: SetRoleInput,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ user: PublicUser }> {
    const user = await runGraphQL(
      this.usersService.setRole(id, input.role, req.user?.id),
    );
    return { user };
  }

  @UserHasPermission({ permission: { user: ['delete'] } })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await runGraphQL(this.usersService.deactivate(id, req.user?.id));
  }
}
