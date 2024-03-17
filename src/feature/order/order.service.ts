import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InvoiceStatusHistory } from 'src/entity/invoice-history-status.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import {
  CalculationType,
  CouponFilterType,
  CouponType,
  OrderStatus,
} from 'src/enum';
import { EntityManager, Repository } from 'typeorm';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { PaymentOption } from 'src/entity/payment-option.entity';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { Driver } from 'src/entity/driver.entity';
import { UrgentActionNeeded } from 'src/entity/urgent-action-needed.entity';
import { CouponAppliedItem, MoneyType } from 'src/type';
import { Restaurant } from 'src/entity/restaurant.entity';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { Coupon } from 'src/entity/coupon.entity';
import { Unit } from 'src/entity/unit.entity';

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
        where: { order_id: currentOrder.order_id },
        order: { logged_at: 'DESC' },
      });
      const latestDriverStatus = await this.driverStatusLogRepo.findOne({
        where: { order_id: currentOrder.order_id },
        order: { logged_at: 'DESC' },
      });
      if (currentOrder) {
        await this.handleOrderFlowBaseOnAhahaStatus(
          currentOrder,
          latestOrderStatus?.order_status_id,
          latestDriverStatus?.driver_id,
          webhookData,
        );
        return { message: 'Order updated successfully' };
      }
      return { message: 'Order not existed' };
    } catch (error) {
      this.logger.error(`An error occurred while updating order: ${error}`);
      throw new InternalServerErrorException();
    }
  }
  private async handleOrderFlowBaseOnAhahaStatus(
    order: Order,
    latestOrderStatus: OrderStatus,
    latestDriverId,
    webhookData,
  ) {
    const PATH_STATUS = webhookData?.path[2]?.status; // assume 3rd is status record
    const SUB_STATUS = webhookData?.sub_status;

    const orderStatusLog = new OrderStatusLog();
    orderStatusLog.order_id = order.order_id;
    switch (webhookData.status) {
      case 'ASSIGNING':
        if (
          latestOrderStatus !== OrderStatus.PROCESSING &&
          latestOrderStatus !== OrderStatus.READY
        ) {
          const action = new UrgentActionNeeded();
          action.description = `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> is assigning but the order status is neither PROCESSING nor READY'. Need action from admin !!!`;
          await this.urgentActionNeededRepo.save(action);
          break;
        }

        if (webhookData.rebroadcast_comment) {
          if (latestDriverId) {
            //Driver_Status_Log
            const driverStatusLog = new DriverStatusLog();
            driverStatusLog.driver_id = latestDriverId;
            driverStatusLog.order_id = order.order_id;
            driverStatusLog.note = webhookData.rebroadcast_comment;
            await this.driverStatusLogRepo.save(driverStatusLog);
          } else {
            this.logger.error(
              `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> is rebroadcasting but the order didnot have any driver infomation before`,
            );
          }
        } else {
          //do nothing
        }
        break;
      case 'ACCEPTED':
        if (
          latestOrderStatus !== OrderStatus.PROCESSING &&
          latestOrderStatus !== OrderStatus.READY
        ) {
          const action = new UrgentActionNeeded();
          action.description = `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> has been accepted by the driver but the order status is neither PROCESSING nor READY'. Need to check the ISSUE !!!`;
          await this.urgentActionNeededRepo.save(action);
          break;
        }

        if (latestDriverId) {
          this.logger.error(
            `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> get a driver but the order has been assigned to other driver. Need to check the ISSUE !!!`,
          );
        }

        const driverType =
          webhookData.service_id === 'VNM-PARTNER-2ALL' ? 'ONWHEEL' : 'AHAMOVE';
        const currentDriver = await this.driverRepo.findOne({
          where: { reference_id: webhookData.supplier_id, type: driverType },
        });
        let driverId = currentDriver?.driver_id;
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

        break;
      case 'CANCELLED':
        // //Order_Status_Log with status STUCK
        // orderStatusLog.order_status_id = OrderStatus.STUCK;
        // await this.orderStatusLogRepo.save(orderStatusLog);
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
          await this.orderStatusLogRepo.save({ ...orderStatusLog });
          orderStatusLog.order_status_id = OrderStatus.DELIVERING;
          await this.orderStatusLogRepo.save({ ...orderStatusLog });
        } else if (latestOrderStatus === OrderStatus.READY) {
          // order_status == READY
          // Order_Status_Log with DELIVERING
          orderStatusLog.order_status_id = OrderStatus.DELIVERING;
          await this.orderStatusLogRepo.save(orderStatusLog);
        } else {
          //Urgent_Action_Needed
          const action = new UrgentActionNeeded();
          action.description = `Order <${order.order_id}>: Food has been picked up BUT the status is neither PROCESSING nor READY. Need action from admin !!!`;
          await this.urgentActionNeededRepo.save(action);
        }
        break;
      case 'COMPLETED':
        if (SUB_STATUS === 'RETURNED') {
          break;
        }
        if (latestOrderStatus !== OrderStatus.DELIVERING) {
          const action = new UrgentActionNeeded();
          action.description = `Order <${order.order_id}>: Ahavmove order <${webhookData._id}> is completed but the order status is not DELIVERING'. Need action from admin !!!`;
          await this.urgentActionNeededRepo.save(action);
          break;
        }
        if (PATH_STATUS === 'FAILED') {
          // Order_Status_Log with FAILED
          orderStatusLog.order_status_id = OrderStatus.FAILED;
          await this.orderStatusLogRepo.save(orderStatusLog);
        } else if (PATH_STATUS === 'COMPLETED') {
          // Order_Status_Log with COMPLETED
          orderStatusLog.order_status_id = OrderStatus.COMPLETED;
          await this.orderStatusLogRepo.save(orderStatusLog);
        }
        break;
      default:
        this.logger.log('The value does not match any case');
        break;
    }
  }

  async cancelOrder(order_id, source) {
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
          const orderStatusLog = new OrderStatusLog();
          orderStatusLog.logged_at = new Date().getTime();
          orderStatusLog.order_status_id = OrderStatus.CANCELLED;
          orderStatusLog.note = 'momo payment has been failed';
          await this.orderStatusLogRepo.save(orderStatusLog);
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

  async getCutleryFee(
    restaurant_id: number,
    quantity: number,
  ): Promise<MoneyType> {
    const restaurant = await this.entityManager
      .createQueryBuilder(Restaurant, 'restaurant')
      .leftJoinAndSelect('restaurant.unit_obj', 'unit')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
      .getOne();

    if (!restaurant) {
      throw new CustomRpcException(2, 'Restaurant doesnot exist');
    }
    if (!restaurant.cutlery_price) {
      return {
        amount: 0,
        currency: restaurant.unit_obj.symbol,
      };
    }
    return {
      amount: restaurant.cutlery_price * quantity,
      currency: restaurant.unit_obj.symbol,
    };
  }

  async getCouponInfoWithRestaurntIds(
    restaurnt_ids: number[],
  ): Promise<Coupon[]> {
    const now = Date.now();

    //get valid coupon list from table Coupon
    const validCoupons = await this.entityManager
      .createQueryBuilder(Coupon, 'coupon')
      .where('coupon.is_active = 1')
      .leftJoinAndSelect('coupon.restaurant_coupon_obj', 'resCoup')
      .andWhere('coupon.valid_from <= :now', { now })
      .andWhere('coupon.valid_until >= :now', { now })
      .andWhere('coupon.out_of_budget = 0')
      .andWhere('coupon.coupon_type = :type', { type: CouponType.RESTAURANT })
      .getMany();

    if (restaurnt_ids.length == 0) {
      return validCoupons;
    }

    //filter it with the table Restaurant_Coupon based on the filter_type
    const uniqueResaurantIds = [...new Set(restaurnt_ids)];
    const filteredCoupons = [];
    for (const coupon of validCoupons) {
      const couponRestarantIds = coupon.restaurant_coupon_obj.map(
        (i) => i.restaurant_id,
      );
      const overlapRestarantIds = couponRestarantIds.filter((i) =>
        uniqueResaurantIds.includes(i),
      );
      if (coupon.filter_type === CouponFilterType.INCLUDED) {
        if (overlapRestarantIds.length > 0) {
          //only one item in the include list -> pass
          filteredCoupons.push(coupon);
        }
      } else if (coupon.filter_type === CouponFilterType.EXCLUDED) {
        if (overlapRestarantIds.length < uniqueResaurantIds.length) {
          //only one item is NOT in the include list -> pass
          filteredCoupons.push(coupon);
        }
      }
    }
    return filteredCoupons;
  }

  async getCouponInfoWithSkus(sku_ids: number[]): Promise<Coupon[]> {
    const now = Date.now();

    //get valid coupon list from table Coupon
    const validCoupons = await this.entityManager
      .createQueryBuilder(Coupon, 'coupon')
      .where('coupon.is_active = 1')
      .leftJoinAndSelect('coupon.skus_coupon_obj', 'skuCoup')
      .andWhere('coupon.valid_from <= :now', { now })
      .andWhere('coupon.valid_until >= :now', { now })
      .andWhere('coupon.out_of_budget = 0')
      .andWhere('coupon.coupon_type = :type', { type: CouponType.SKU })
      .getMany();

    if (sku_ids.length == 0) {
      return validCoupons;
    }

    //filter it with the table SKUs_coupon based on the filter_type
    const uniqueSkuIds = [...new Set(sku_ids)];
    const filteredCoupons = [];
    for (const coupon of validCoupons) {
      const couponSkuIds = coupon.skus_coupon_obj.map((i) => i.sku_id);
      const overlapSkuIds = couponSkuIds.filter((i) =>
        uniqueSkuIds.includes(i),
      );
      if (coupon.filter_type === CouponFilterType.INCLUDED) {
        if (overlapSkuIds.length > 0) {
          //only one item in the include list -> pass
          filteredCoupons.push(coupon);
        }
      } else if (coupon.filter_type === CouponFilterType.EXCLUDED) {
        if (overlapSkuIds.length < uniqueSkuIds.length) {
          //only one item is NOT in the include list -> pass
          filteredCoupons.push(coupon);
        }
      }
    }

    return filteredCoupons;
  }

  async validateApplyingCouponCode(
    coupon_code: string,
    restaurant_id: number,
    sku_ids: number[],
  ): Promise<Coupon | undefined> {
    let validCoupon: Coupon;
    //Get restaurant coupon
    const restaurantCoupons: Coupon[] =
      await this.getCouponInfoWithRestaurntIds([restaurant_id]);
    validCoupon = restaurantCoupons.find((i) => i.coupon_code == coupon_code);
    if (validCoupon) {
      return validCoupon;
    }
    //get sku coupon
    const skuCoupons: Coupon[] = await this.getCouponInfoWithSkus(sku_ids);

    validCoupon = skuCoupons.find((i) => i.coupon_code == coupon_code);
    if (validCoupon) {
      return validCoupon;
    }

    return validCoupon;
  }

  calculateDiscountAmount(coupon: Coupon, items: CouponAppliedItem[]): number {
    let discountAmount: number = 0;
    //calculate the amount base to apply promotion code
    let amount_base: number = 0;
    for (const item of items) {
      amount_base +=
        (item.price_after_discount + item.packaging_price) * item.qty_ordered;
    }

    // check if the amount base is greater than minimum_order_value
    if (amount_base < coupon.mininum_order_value) {
      //the order does not reach the minimum order value
      throw new CustomRpcException(5, {
        minium_order_value: coupon.mininum_order_value,
      });
    }

    //calculate the discount amount
    if (coupon.calculation_type === CalculationType.PERCENTAGE) {
      discountAmount = amount_base * (coupon.discount_value / 100);
      discountAmount = Math.min(discountAmount, coupon.maximum_discount_amount);
    } else if (coupon.calculation_type === CalculationType.FIXED) {
      discountAmount = coupon.discount_value;
    }

    return discountAmount;
  }

  async getUnitById(unit_id: number): Promise<Unit> {
    return await this.entityManager
      .createQueryBuilder(Unit, 'unit')
      .where('unit.unit_id = :unit_id', { unit_id })
      .getOne();
  }
}
