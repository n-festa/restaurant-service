import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoController } from './momo.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { InvoiceStatusHistoryModule } from 'src/feature/invoice-status-history/invoice-status-history.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([MomoTransaction]), InvoiceStatusHistoryModule],
  providers: [MomoService],
  controllers: [MomoController],
})
export class MomoModule {}
