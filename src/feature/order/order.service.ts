import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import e from 'express';
import { Order } from 'src/entity/order.entity';
import { OrderStatus } from 'src/enum';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(@InjectRepository(Order) private orderRepo: Repository<Order>) {}

  async updateOrderStatusFromAhamoveWebhook(orderId, webhookData): Promise<any> {
    try {
      this.logger.log(`receiving data from webhook to ${orderId} with ${webhookData.status}`);
      const currentOrder = await this.orderRepo.findOne({ where: { delivery_order_id: orderId } });
      if (currentOrder) {
        const { status, cancel_time, sub_status, pickup_time, complete_time, fail_time, return_time, processing_time, accept_time } = webhookData;
        const ahavemoveData = { status, accept_time, cancel_time, pickup_time, complete_time, fail_time, return_time, sub_status, processing_time, path_status: '' };
        ahavemoveData.path_status = webhookData?.path?.status;
        const orderData = {
          order_pickup_time: currentOrder.pickup_time,
          is_preorder: currentOrder.is_preorder,
          ready_time: currentOrder.ready_time,
        };
        const updateData = this.getOrderStatusBaseOnAhahaStatus(orderData, ahavemoveData);
        this.logger.log(`Updating data from webhook to ${orderId} with ${JSON.stringify(updateData)}`);
        await this.orderRepo.update(currentOrder.order_id, { ...currentOrder, ...updateData });
        return { message: 'Order updated successfully' };
      }
      return { message: 'Order not existed' };
    } catch (error) {
      this.logger.error(`An error occurred while updating order: ${error.message}`);
      throw new InternalServerErrorException();
    }
  }
  private getOrderStatusBaseOnAhahaStatus(
    { order_pickup_time, is_preorder, ready_time },
    { status, sub_status, path_status, accept_time, cancel_time, pickup_time, complete_time, fail_time, return_time, processing_time },
  ) {
    let data = {};
    switch (status) {
      case 'ASSIGNING':
        if (!is_preorder) {
          data = {
            order_status_id: OrderStatus.PROCESSING,
            processing_time,
          };
        } else if (is_preorder) {
          data = {};
        }
        break;
      case 'ACCEPTED':
        data = {
          driver_accept_time: accept_time,
        };
        break;
      case 'CANCELLED':
        data = {
          driver_cancel_time: cancel_time,
        };
        break;
      // case 'CANCELLED':
      //   data = {
      //     cancel_time,
      //   };
      //   break;
      case 'IN PROCESS':
        if (path_status === 'FAILED') {
          data = {};
        } else {
          if (pickup_time) {
            data = {
              order_status_id: OrderStatus.DELIVERING,
              pickup_time: pickup_time,
              ready_time: !ready_time ? pickup_time : ready_time, // if ready_time is null or equal = 0
            };
          } else if (!pickup_time) {
            data = {};
          }
        }
        break;
      case 'COMPLETED':
        if (path_status === 'FAILED') {
          data = {
            order_status_id: OrderStatus.FAILED,
            fail_time,
          };
        } else if (path_status === 'RETURNED') {
          data = {
            return_time,
          };
        } else if (sub_status === 'COMPLETED') {
          data = {
            order_status_id: OrderStatus.COMPLETED,
            completed_time: complete_time,
          };
        } else {
          // data = {
          //   order_status_id: OrderStatus.COMPLETED,
          //   completed_time: complete_time,
          // };
          data = {};
        }
        break;
      default:
        this.logger.log('The value does not match any case');
        break;
    }
    return data;
  }
}
