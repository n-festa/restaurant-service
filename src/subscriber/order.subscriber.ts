import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Order } from 'src/entity/order.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';

// @EventSubscriber()
@Injectable()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    dataSource: DataSource,
    @Inject('GATEWAY_SERVICE')
    private readonly gatewayClient: ClientProxy,
  ) {
    dataSource.subscribers.push(this);
  }
  listenTo() {
    return Order;
  }

  /**
   * Called after entity update.
   */
  async afterUpdate(event: UpdateEvent<Order>) {
    console.log(`AFTER ENTITY UPDATED: `, event.entity);

    // this.gatewayClient.emit('order_updated', {
    //   order_id: event.entity.order_id,
    // });
  }
}
