import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AhamoveService } from './ahamove.service';
import { ConfigModule } from '@nestjs/config';
import { AhamoveController } from './ahamove.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AhamoveOrderEntity } from 'src/entity/ahamove-order.entity';
import { AhamoveOrderHookEntity } from 'src/entity/ahamove-order-hook.entity';
import { InvoiceStatusHistoryModule } from 'src/feature/invoice-status-history/invoice-status-history.module';
import { OrderModule } from 'src/feature/order/order.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([AhamoveOrderEntity, AhamoveOrderHookEntity]),
    InvoiceStatusHistoryModule,
    OrderModule,
  ],
  providers: [AhamoveService],
  exports: [AhamoveService],
  controllers: [AhamoveController],
})
export class AhamoveModule {}
