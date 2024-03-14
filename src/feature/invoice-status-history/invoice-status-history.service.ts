import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { Invoice } from 'src/entity/invoice.entity';
import { Order } from 'src/entity/order.entity';
import { InvoiceHistoryStatusEnum, OrderStatus } from 'src/enum';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OrderService } from '../order/order.service';

@Injectable()
export class InvoiceStatusHistoryService {
  private readonly logger = new Logger(InvoiceStatusHistoryService.name);
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory)
    private invoiceHistoryStatusRepo: Repository<InvoiceStatusHistory>,
    private readonly orderService: OrderService,
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
      console.log('????', currentInvoice);

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
