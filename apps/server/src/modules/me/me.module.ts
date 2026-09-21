import { Module } from '@nestjs/common';
import { MeController } from './me.controller.ts';

@Module({
  controllers: [MeController],
})
export class MeModule {}
