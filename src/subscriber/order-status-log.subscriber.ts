import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  TransactionCommitEvent,
  TransactionStartEvent,
} from 'typeorm';

@Injectable()
// @EventSubscriber()
export class OrderStatusLogSubscriber
  implements EntitySubscriberInterface<OrderStatusLog>
{
  constructor(
    dataSource: DataSource,
    @Inject('GATEWAY_SERVICE')
    private readonly gatewayClient: ClientProxy,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return OrderStatusLog;
  }

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<OrderStatusLog>) {
    console.log(`AFTER ENTITY INSERTED: `, event.entity);
    // this.gatewayClient.emit('order_updated', {
    //   order_id: event.entity.order_id,
    // });
  }
}
