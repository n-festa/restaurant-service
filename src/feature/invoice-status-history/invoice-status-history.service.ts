import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { Invoice } from 'src/entity/invoice.entity';
import { Order } from 'src/entity/order.entity';
import { InvoiceHistoryStatusEnum, OrderStatus } from 'src/enum';
import { Repository } from 'typeorm';

@Injectable()
export class InvoiceStatusHistoryService {
  private readonly logger = new Logger(InvoiceStatusHistoryService.name);
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceStatusHistory) private invoiceHistoryStatusRepo: Repository<InvoiceStatusHistory>,
  ) {}

  async updateInvoiceHistoryFromMomoWebhook(orderId, webhookData): Promise<any> {
    try {
      this.logger.log(`receiving data from webhook to ${orderId} with ${webhookData.status}`);
      const currentInvoice = await this.invoiceRepo.findOne({ where: { payment_order_id: orderId } });
      if (currentInvoice) {
        const updateData = this.convertMomoResultCode(webhookData.resultCode, webhookData.message);
        this.logger.log(`Updating data from webhook to ${orderId} with ${JSON.stringify(updateData)}`);
        const invoiceHistoryStatus = {};
        await this.invoiceHistoryStatusRepo.update(currentInvoice.order_id, { ...currentInvoice, ...updateData });
        return { message: 'Order updated successfully' };
      }
      return { message: 'Order not existed' };
    } catch (error) {
      this.logger.error(`An error occurred while updating order: ${error.message}`);
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
