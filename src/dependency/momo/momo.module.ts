import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoController } from './momo.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { OrderModule } from 'src/feature/order/order.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([MomoTransaction]), OrderModule],
  providers: [MomoService],
  controllers: [MomoController],
})
export class MomoModule {}
