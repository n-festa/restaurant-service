import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { Invoice } from 'src/entity/invoice.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@Injectable()
// @EventSubscriber()
export class InvoiceStatusHistorySubscriber
  implements EntitySubscriberInterface<InvoiceStatusHistory>
{
  constructor(
    private dataSource: DataSource,
    @Inject('GATEWAY_SERVICE')
    private readonly gatewayClient: ClientProxy,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return InvoiceStatusHistory;
  }

  /**
   * Called after entity insertion.
   */
  async afterInsert(event: InsertEvent<InvoiceStatusHistory>) {
    console.log(`AFTER ENTITY INSERTED: `, event.entity.invoice_id);

    // const order = await this.dataSource
    //   .createQueryBuilder(Invoice, 'invoice')
    //   .where('invoice.invoice_id = :invoice_id', {
    //     invoice_id: event.entity.invoice_id,
    //   })
    //   .getOne();
    // if (order) {
    //   this.gatewayClient.emit('order_updated', {
    //     order_id: order.order_id,
    //   });
    // }
  }
}
