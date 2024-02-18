import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AhamoveService } from './ahamove.service';
import { ConfigModule } from '@nestjs/config';
import { AhamoveController } from './ahamove.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AhamoveService],
  exports: [AhamoveService],
  controllers: [AhamoveController],
})
export class AhamoveModule {}
