import { Controller, Get, Logger } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MessagePattern } from '@nestjs/microservices';
import { MomoRequestDTO } from './momo.dto';

@Controller('momo')
export class MomoController {
  private readonly logger = new Logger(MomoController.name);

  constructor(private readonly momoService: MomoService) {}

  @MessagePattern({ cmd: 'create_momo_payment' })
  async sendMomoPaymentRequest(payload: MomoRequestDTO) {
    return this.momoService.sendMomoPaymentRequest(payload);
  }

  @MessagePattern({ cmd: 'momo_payment_ipn_callback' })
  async handleMomoCallback(payload: any) {
    return this.momoService.handleMoMoIpnCallBack(payload);
  }
}
