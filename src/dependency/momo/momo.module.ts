import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoController } from './momo.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MomoTransaction } from 'src/entity/momo-transaction.entity';
import { InvoiceStatusHistoryModule } from 'src/feature/invoice-status-history/invoice-status-history.module';
import { Invoice } from 'src/entity/invoice.entity';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { OrderModule } from 'src/feature/order/order.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([MomoTransaction, Invoice, InvoiceStatusHistory]),
    InvoiceStatusHistoryModule,
    OrderModule,
  ],
  providers: [MomoService],
  controllers: [MomoController],
})
export class MomoModule {}
