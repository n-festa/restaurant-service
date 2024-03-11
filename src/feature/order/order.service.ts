import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { OrderStatus } from 'src/enum';
import { EntityManager, Repository } from 'typeorm';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { PaymentOption } from 'src/entity/payment-option.entity';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { Driver } from 'src/entity/driver.entity';
import { UrgentActionNeeded } from 'src/entity/urgent-action-needed.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(InvoiceStatusHistory)
    private orderStatusHistoryRepo: Repository<InvoiceStatusHistory>,
    @InjectRepository(OrderStatusLog)
    private orderStatusLogRepo: Repository<OrderStatusLog>,
    @InjectRepository(DriverStatusLog)
    private driverStatusLogRepo: Repository<DriverStatusLog>,
    @InjectRepository(Driver)
    private driverRepo: Repository<Driver>,
    @InjectRepository(UrgentActionNeeded)
    private urgentActionNeededRepo: Repository<UrgentActionNeeded>,
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
      const latestOrderStatus = await this.orderStatusLogRepo.findOne({
        where: { order_id: orderId },
        order: { logged_at: 'DESC' },
      });
      const latestDriverStatus = await this.driverStatusLogRepo.findOne({
        where: { order_id: orderId },
        order: { logged_at: 'DESC' },
      });
      if (currentOrder) {
        await this.handleOrferFlowBaseOnAhahaStatus(
          currentOrder,
          latestOrderStatus?.order_status_id,
          latestDriverStatus?.driver_id,
          webhookData,
        );
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
  private async handleOrferFlowBaseOnAhahaStatus(
    order: Order,
    latestOrderStatus: OrderStatus,
    latestDriverStatus,
    webhookData,
  ) {
    const PATH_STATUS = webhookData?.path?.status;
    const SUB_STATUS = webhookData?.sub_status;

    const orderStatusLog = new OrderStatusLog();
    orderStatusLog.order_id = order.order_id;
    switch (webhookData.status) {
      case 'ASSIGNING':
        if (!webhookData.rebroadcast_comment) {
          if (!order.is_preorder) {
            if (latestOrderStatus === OrderStatus.IDLE) {
              //Order_Status_Log with orderid and order_status_id = PROCESSING
              orderStatusLog.order_status_id = OrderStatus.PROCESSING;
              await this.orderStatusLogRepo.save(orderStatusLog);
            }
          }
        } else {
          if (order.driver_id && latestOrderStatus === OrderStatus.PROCESSING) {
            //Driver_Status_Log
            const driverStatusLog = new DriverStatusLog();
            driverStatusLog.driver_id = order.driver_id;
            driverStatusLog.order_id = order.order_id;
            driverStatusLog.note = webhookData.rebroadcast_comment;
            await this.driverStatusLogRepo.save(driverStatusLog);
          }
        }
        break;
      case 'ACCEPTED':
        if (
          latestDriverStatus &&
          latestOrderStatus === OrderStatus.PROCESSING
        ) {
          const driverType =
            webhookData.service_id === 'VNM-PARTNER-2ALL'
              ? 'ONWHEEL'
              : 'AHAMOVE';
          const currentDriver = await this.driverRepo.findOne({
            where: { reference_id: webhookData.supplier_id, type: driverType },
          });
          let driverId = currentDriver.driver_id;
          if (currentDriver) {
            currentDriver.license_plates = webhookData.supplier_plate_number;
            currentDriver.phone_number = webhookData.supplier_id;
            currentDriver.name = webhookData.supplier_name;
            await this.driverRepo.save(currentDriver);
          } else {
            const newDriver = new Driver();
            newDriver.license_plates = webhookData.supplier_plate_number;
            newDriver.phone_number = webhookData.supplier_id;
            newDriver.name = webhookData.supplier_name;
            newDriver.type = driverType;
            newDriver.reference_id = webhookData.supplier_id;
            const result = await this.driverRepo.save(newDriver);
            driverId = result.driver_id;
          }
          const driverStatusLog = new DriverStatusLog();
          driverStatusLog.driver_id = driverId;
          driverStatusLog.order_id = order.order_id;
          await this.driverStatusLogRepo.save(driverStatusLog);
        }
        break;
      case 'CANCELLED':
        //Order_Status_Log with status STUCK
        orderStatusLog.order_status_id = OrderStatus.STUCK;
        await this.orderStatusLogRepo.save(orderStatusLog);
        //Urgent_Action_Needed
        const action = new UrgentActionNeeded();
        action.description = `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> got cancel with comment '<${webhookData.cancel_comment}>'. Need action from admin !!!`;
        await this.urgentActionNeededRepo.save(action);
        break;
      case 'IN PROCESS':
        // path status is failed => do nothing
        if (PATH_STATUS === OrderStatus.FAILED) {
          break;
        }
        // order_status == PROCESSING
        // Order_Status_Log with READY and DELIVERING
        if (latestOrderStatus === OrderStatus.PROCESSING) {
          orderStatusLog.order_status_id = OrderStatus.READY;
          await this.orderStatusLogRepo.save(orderStatusLog);
          orderStatusLog.order_status_id = OrderStatus.DELIVERING;
          await this.orderStatusLogRepo.save(orderStatusLog);
        } else if (latestOrderStatus === OrderStatus.READY) {
          // order_status == READY
          // Order_Status_Log with DELIVERING
          orderStatusLog.order_status_id = OrderStatus.COMPLETED;
          await this.orderStatusLogRepo.save(orderStatusLog);
        }
        break;
      case 'COMPLETED':
        if (SUB_STATUS === 'RETURNED') {
          break;
        }
        if (PATH_STATUS === 'FAILED') {
          // order_status == PROCESSING
          // Order_Status_Log with FAILED
          if (latestOrderStatus === OrderStatus.DELIVERING) {
            orderStatusLog.order_status_id = OrderStatus.FAILED;
            await this.orderStatusLogRepo.save(orderStatusLog);
          }
        } else if (PATH_STATUS === 'COMPLETED') {
          // order_status == PROCESSING
          // Order_Status_Log with COMPLETED
          if (latestOrderStatus === OrderStatus.DELIVERING) {
            orderStatusLog.order_status_id = OrderStatus.COMPLETED;
            await this.orderStatusLogRepo.save(orderStatusLog);
          }
        }
        break;
      default:
        this.logger.log('The value does not match any case');
        break;
    }
  }

  async cancelOrder(order_id, invoice_id, source) {
    const currentOrder = await this.orderRepo.findOne({
      where: { order_id: order_id },
    });
    const isMomo = source?.isMomo;
    this.logger.debug('canceling Order', JSON.stringify(currentOrder));
    if (!currentOrder) {
      this.logger.warn('The order status is not existed');
      return;
    }
    if (isMomo) {
      const latestOrderStatus = await this.orderStatusLogRepo.findOne({
        where: { order_id: order_id },
        order: { logged_at: 'DESC' },
      });
      if (
        latestOrderStatus?.order_status_id === OrderStatus.NEW ||
        latestOrderStatus?.order_status_id === OrderStatus.IDLE
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
          // UPDATE ORDER STATUS
          // const momoInvoiceStatusHistory = new InvoiceStatusHistory();
          // momoInvoiceStatusHistory.invoice_id = invoice_id || -1;
          // momoInvoiceStatusHistory.status_id = OrderStatus.CANCELLED;
          // momoInvoiceStatusHistory.note = 'momo payment has been failed';
          // momoInvoiceStatusHistory.status_history_id = uuidv4();
          // await this.orderStatusHistoryRepo.insert(momoInvoiceStatusHistory);
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
