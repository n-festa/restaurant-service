import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { OrderController } from './order.controller';

@Module({
  providers: [OrderService],
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
