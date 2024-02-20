import { Controller, Logger, Body, Post } from '@nestjs/common';
// import { SseGateway } from './sse.gateway';
import { Coordinate } from 'src/type';
import { AhamoveService } from './ahamove.service';
import { MessagePattern } from '@nestjs/microservices';
import { Order } from './dto/ahamove.dto';
import { AhamoveOrderEntity } from 'src/entity/ahamove-order.entity';

@Controller('ahamove')
export class AhamoveController {
  private readonly logger = new Logger(AhamoveController.name);

  constructor(private readonly ahamoveService: AhamoveService) {}
  /** List of connected clients */
  @MessagePattern({ cmd: 'get_ahamove_order_by_id' })
  getAhamoveOrderByOrderId(orderId: string): Promise<AhamoveOrderEntity> {
    return this.ahamoveService.getAhamoveOrderByOrderId(orderId);
  }

  @MessagePattern({ cmd: 'save_ahamove_order_tracking' })
  saveAhamoveTrackingWebhook(order: any): Promise<AhamoveOrderEntity> {
    return this.ahamoveService.saveAhamoveTrackingWebhook(order);
  }

  @MessagePattern({ cmd: 'get_ahamove_estimate' })
  getEstimateFee(@Body() coordinates: Coordinate[]) {
    return this.ahamoveService.estimatePrice(coordinates);
  }

  @MessagePattern({ cmd: 'create_ahamove_order' })
  postAhamoveOrder(@Body() order: Order) {
    return this.ahamoveService.postAhamoveOrder(order);
  }
}
