import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { OrderController } from './order.controller';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { AhamoveModule } from 'src/dependency/ahamove/ahamove.module';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { UrgentActionNeeded } from 'src/entity/urgent-action-needed.entity';

@Module({
  providers: [OrderService],
  imports: [
    TypeOrmModule.forFeature([
      Order,
      InvoiceStatusHistory,
      OrderStatusLog,
      DriverStatusLog,
      UrgentActionNeeded,
    ]),
    forwardRef(() => AhamoveModule),
  ],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
