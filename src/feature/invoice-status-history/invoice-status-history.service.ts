import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { Invoice } from 'src/entity/invoice.entity';
import { Order } from 'src/entity/order.entity';
import { InvoiceHistoryStatusEnum, OrderStatus } from 'src/enum';
import { EntityManager, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OrderService } from '../order/order.service';
import { FALSE } from 'src/constant';

@Injectable()
export class InvoiceStatusHistoryService {
  private readonly logger = new Logger(InvoiceStatusHistoryService.name);
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory)
    private invoiceHistoryStatusRepo: Repository<InvoiceStatusHistory>,
    private readonly orderService: OrderService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async updateInvoiceHistoryFromMomoWebhook(webhookData): Promise<any> {
    try {
      const requestId = webhookData.requestId;
      this.logger.log(
        `receiving data from webhook to ${requestId} with ${JSON.stringify(
          webhookData,
        )}`,
      );
      const currentInvoice = await this.invoiceRepo.findOne({
        where: { payment_order_id: requestId },
      });

      if (currentInvoice) {
        const updateData = this.convertMomoResultCode(
          webhookData.resultCode,
          webhookData.message,
        );
        this.logger.log(
          `Updating data from webhook to ${requestId} with ${JSON.stringify(
            updateData,
          )}`,
        );
        const momoInvoiceStatusHistory = new InvoiceStatusHistory();
        momoInvoiceStatusHistory.invoice_id = currentInvoice.invoice_id;
        momoInvoiceStatusHistory.status_id = updateData.status_id;
        momoInvoiceStatusHistory.note = updateData.note;
        momoInvoiceStatusHistory.status_history_id = uuidv4();
        await this.invoiceHistoryStatusRepo.save(momoInvoiceStatusHistory);
        if (updateData.status_id === InvoiceHistoryStatusEnum.FAILED) {
          await this.orderService.cancelOrder(currentInvoice.order_id, {
            isMomo: true,
          });
        } else if (updateData.status_id === InvoiceHistoryStatusEnum.PAID) {
          //Create Ahamove Request if the order is the normal order
          const order = await this.entityManager
            .createQueryBuilder(Order, 'order')
            .where('order.order_id = :order_id', {
              order_id: currentInvoice.order_id,
            })
            .getOne();
          if (!order) {
            this.logger.error(`Order ${currentInvoice.order_id} not existed`);
            throw new InternalServerErrorException();
          }
          if (order.is_preorder == FALSE && !order.delivery_order_id) {
            const deliveryOrderId =
              await this.orderService.createDeliveryRequest(order, 0);
            await this.entityManager
              .createQueryBuilder()
              .update(Order)
              .set({
                delivery_order_id: deliveryOrderId,
              })
              .where('order_id = :order_id', { order_id: order.order_id })
              .execute();
          }
        }
        return { message: 'Order updated successfully' };
      }
      return { message: 'Order not existed' };
    } catch (error) {
      this.logger.error(
        `An error occurred while updating momo callback: ${error.message}`,
      );
      throw new InternalServerErrorException();
    }
  }
  private convertMomoResultCode(code, message) {
    const isFinal = (x) => {
      return x === 0 || x === 99 || (x >= 1001 && x <= 4100);
    };
    if (isFinal(code)) {
      if (code === 0) {
        return {
          status_id: InvoiceHistoryStatusEnum.PAID,
        };
      } else if (code !== 9000) {
        return {
          status_id: InvoiceHistoryStatusEnum.FAILED,
          note: message,
        };
      }
    } else {
      if (code === 9000) {
        return {
          status_id: InvoiceHistoryStatusEnum.PENDING,
          note: message,
        };
      } else if (code !== 0) {
        return {
          status_id: InvoiceHistoryStatusEnum.PENDING,
          note: message,
        };
      }
    }
  }
}
