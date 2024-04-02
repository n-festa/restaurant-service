import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Invoice } from 'src/entity/invoice.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';

@Injectable()
// @EventSubscriber()
export class InvoiceSubscriber implements EntitySubscriberInterface<Invoice> {
  constructor(
    dataSource: DataSource,
    @Inject('GATEWAY_SERVICE')
    private readonly gatewayClient: ClientProxy,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Invoice;
  }

  //   /**
  //    * Called after entity insertion.
  //    */
  //   afterInsert(event: InsertEvent<Invoice>) {
  //     // console.log(`AFTER ENTITY INSERTED: `, event.entity);
  //     this.gatewayClient.emit('order_updated', {
  //       order_id: event.entity.order_id,
  //     });
  //   }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<Invoice>) {
    // console.log(`AFTER ENTITY UPDATED: `, event.entity);
    // this.gatewayClient.emit('order_updated', {
    //   order_id: event.entity.order_id,
    // });
  }
}
