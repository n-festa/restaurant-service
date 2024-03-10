import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { OrderStatus } from 'src/enum';
import { EntityManager, Repository } from 'typeorm';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { PaymentOption } from 'src/entity/payment-option.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(InvoiceStatusHistory)
    private orderStatusHistoryRepo: Repository<InvoiceStatusHistory>,
    private ahamoveService: AhamoveService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async updateOrderStatusFromAhamoveWebhook(
    orderId,
    webhookData,
  ): Promise<any> {
    try {
      this.logger.log(
        `receiving data from webhook to ${orderId} with ${webhookData.status}`,
      );
      const currentOrder = await this.orderRepo.findOne({
        where: { delivery_order_id: orderId },
      });
      if (currentOrder) {
        const {
          status,
          cancel_time,
          sub_status,
          pickup_time,
          complete_time,
          fail_time,
          return_time,
          processing_time,
          accept_time,
        } = webhookData;
        const ahavemoveData = {
          status,
          accept_time,
          cancel_time,
          pickup_time,
          complete_time,
          fail_time,
          return_time,
          sub_status,
          processing_time,
          path_status: '',
        };
        ahavemoveData.path_status = webhookData?.path?.status;
        const orderData = {
          // order_pickup_time: currentOrder.pickup_time,
          is_preorder: currentOrder.is_preorder,
          // ready_time: currentOrder.ready_time,
          ready_time: '',
        };
        const updateData = this.getOrderStatusBaseOnAhahaStatus(
          orderData,
          ahavemoveData,
        );
        this.logger.log(
          `Updating data from webhook to ${orderId} with ${JSON.stringify(
            updateData,
          )}`,
        );
        await this.orderRepo.update(currentOrder.order_id, {
          ...currentOrder,
          ...updateData,
        });
        return { message: 'Order updated successfully' };
      }
      return { message: 'Order not existed' };
    } catch (error) {
      this.logger.error(
        `An error occurred while updating order: ${error.message}`,
      );
      throw new InternalServerErrorException();
    }
  }
  private getOrderStatusBaseOnAhahaStatus(
    { is_preorder, ready_time },
    {
      status,
      sub_status,
      path_status,
      accept_time,
      cancel_time,
      pickup_time,
      complete_time,
      fail_time,
      return_time,
      processing_time,
    },
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

  async cancelOrder(order_id, source) {
    const currentOrder = await this.orderRepo.findOne({
      where: { order_id: order_id },
    });
    const isMomo = source?.isMomo;
    this.logger.debug('canceling Order', currentOrder);
    if (!currentOrder) {
      this.logger.warn('The order status is not existed');
      return;
    }
    if (isMomo) {
      if (
        // currentOrder.order_status_id === OrderStatus.NEW ||
        // currentOrder.order_status_id === OrderStatus.IDLE
        true
      ) {
        try {
          if (currentOrder.delivery_order_id) {
            //TODO: cancel delivery
            await this.ahamoveService.cancelAhamoveOrder(
              currentOrder.delivery_order_id,
              'momo payment request failed',
            );
          }
        } catch (error) {
          this.logger.error(
            'An error occurred while cancel delivery',
            JSON.stringify(error),
          );
        } finally {
          // insert
          const momoInvoiceStatusHistory = new InvoiceStatusHistory();
          momoInvoiceStatusHistory.invoice_id = order_id;
          momoInvoiceStatusHistory.status_id = OrderStatus.CANCELLED;
          momoInvoiceStatusHistory.note = 'momo payment has been failed';
          momoInvoiceStatusHistory.status_history_id = uuidv4();
          await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
        }
      } else {
        this.logger.warn('The order status is not valid to cancel');
      }
    }
  }

  async getApplicationFeeFromEndPoint(
    items_total: number,
    exchange_rate: number, //Exchange rate to VND
  ): Promise<GetApplicationFeeResponse> {
    const FEE_RATE = 0.03;
    const MAXIMUM_FEE = 75000; //VND
    const MINIMUM_FEE = 1000; //VND

    const preApplicationFee = items_total * FEE_RATE;
    let applicationFee = 0;
    if (preApplicationFee >= MAXIMUM_FEE) {
      applicationFee = MAXIMUM_FEE / exchange_rate;
    } else if (preApplicationFee <= MINIMUM_FEE) {
      applicationFee = MINIMUM_FEE / exchange_rate;
    } else if (
      preApplicationFee < MAXIMUM_FEE &&
      preApplicationFee > MINIMUM_FEE
    ) {
      applicationFee = preApplicationFee / exchange_rate;
    }

    return {
      application_fee: applicationFee,
    };
  }

  async getPaymentOptions(): Promise<PaymentOption[]> {
    return await this.entityManager
      .createQueryBuilder(PaymentOption, 'payment')
      .where('payment.is_active = 1')
      .getMany();
  }
}
