import { Module } from '@nestjs/common';
import { PingResolver } from './ping.resolver.ts';

@Module({ providers: [PingResolver]})
export class PingModule {}
