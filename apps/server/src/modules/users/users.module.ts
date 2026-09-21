import { Module } from '@nestjs/common';
import { AppAuthModule } from '../auth/auth.module.ts';
import { AppUsersService } from './users.service.ts';
import { UsersController } from './users.controller.ts';

@Module({
  imports: [AppAuthModule],
  controllers: [UsersController],
  providers: [AppUsersService],
  exports: [AppUsersService],
})
export class UsersModule {}
