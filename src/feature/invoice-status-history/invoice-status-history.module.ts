import { Module } from '@nestjs/common';
import { InvoiceStatusHistoryService } from './invoice-status-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { Invoice } from 'src/entity/invoice.entity';

@Module({
  providers: [InvoiceStatusHistoryService],
  imports: [TypeOrmModule.forFeature([InvoiceStatusHistory, Invoice])],
  controllers: [],
  exports: [InvoiceStatusHistoryService],
})
export class InvoiceStatusHistoryModule {}
