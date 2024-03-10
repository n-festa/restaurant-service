import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { OrderController } from './order.controller';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';

@Module({
  providers: [OrderService],
  imports: [TypeOrmModule.forFeature([Order, InvoiceStatusHistory])],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
