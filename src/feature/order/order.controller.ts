import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { Repository } from 'typeorm';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private readonly orderService: OrderService,
  ) {}
  @MessagePattern({ cmd: 'get_order_by_id' })
  async getOrderByOrderId(order_id) {
    return this.orderRepo.findOne({ where: { order_id } });
  }

  @MessagePattern({ cmd: 'update_order_status_by_webhook' })
  async updateOrderStatusByWebhook({ delivery_order_id, webhookData }) {
    return this.orderService.updateOrderStatusFromAhamoveWebhook(delivery_order_id, webhookData);
  }
}
