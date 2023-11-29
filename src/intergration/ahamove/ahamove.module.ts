import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AhamoveService } from './ahamove.service';

@Module({
  imports: [HttpModule],
  providers: [AhamoveService],
  exports: [AhamoveService],
})
export class AhamoveModule {}
