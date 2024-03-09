import { Controller, HttpException, UseFilters } from '@nestjs/common';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { Repository } from 'typeorm';
import { OrderService } from './order.service';
import { GetApplicationFeeRequest } from './dto/get-application-fee-request.dto';
import { GeneralServiceResponse } from 'src/dto/general-service-response.dto';
import { CustomRpcExceptionFilter } from 'src/filters/custom-rpc-exception.filter';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';

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
    return this.orderService.updateOrderStatusFromAhamoveWebhook(
      delivery_order_id,
      webhookData,
    );
  }

  @MessagePattern({ cmd: 'get_application_fee' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getApplicationFee(
    data: GetApplicationFeeRequest,
  ): Promise<GetApplicationFeeResponse> {
    const { items_total, exchange_rate } = data;
    return await this.orderService.getApplicationFeeFromEndPoint(
      items_total,
      exchange_rate,
    );
  }
}
