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
  InvoiceHistoryStatusEnum,
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
import {
  CouponAppliedItem,
  CouponValue,
  MoneyType,
  OrderItemRequest,
} from 'src/type';
import { Restaurant } from 'src/entity/restaurant.entity';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { Coupon } from 'src/entity/coupon.entity';
import { Unit } from 'src/entity/unit.entity';
import { CreateOrderRequest } from './dto/create-order-request.dto';
import { CreateOrderResponse } from './dto/create-order-response.dto';
import { CommonService } from '../common/common.service';
import { Address } from 'src/entity/address.entity';
import { OrderSKU } from 'src/entity/order-sku.entity';
import { SKU } from 'src/entity/sku.entity';
import { MenuItem } from 'src/entity/menu-item.entity';
import { ConfigService } from '@nestjs/config';
import { Invoice } from 'src/entity/invoice.entity';
import { OrderDetailResponse } from './dto/order-detail-response.dto';

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
    private readonly commonService: CommonService,
    private readonly configService: ConfigService,
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
      this.logger.error(
        `An error occurred while updating order: ${error.message}`,
      );
      throw new InternalServerErrorException();
    }
  }
  private async handleOrderFlowBaseOnAhahaStatus(
    order: Order,
    latestOrderStatus: OrderStatus,
    latestDriverId,
    webhookData,
  ) {
    const PATH_STATUS = webhookData?.path?.status;
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
          await this.orderStatusLogRepo.save(orderStatusLog);
          orderStatusLog.order_status_id = OrderStatus.DELIVERING;
          await this.orderStatusLogRepo.save(orderStatusLog);
        } else if (latestOrderStatus === OrderStatus.READY) {
          // order_status == READY
          // Order_Status_Log with DELIVERING
          orderStatusLog.order_status_id = OrderStatus.COMPLETED;
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

  async getApplicationFee(
    items_total: number,
    exchange_rate: number, //Exchange rate to VND
  ): Promise<number> {
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

    return applicationFee;
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

  calculateDiscountAmount(
    coupon: Coupon,
    items: CouponAppliedItem[],
  ): CouponValue {
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

    const couponValueFromPlatform =
      (discountAmount * coupon.platform_sponsor_ratio_percentage) / 100;

    return {
      coupon_value_from_platform: couponValueFromPlatform,
      coupon_value_from_restaurant: discountAmount - couponValueFromPlatform,
    };
  }

  async getUnitById(unit_id: number): Promise<Unit> {
    return await this.entityManager
      .createQueryBuilder(Unit, 'unit')
      .where('unit.unit_id = :unit_id', { unit_id })
      .getOne();
  }

  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const {
      customer_id,
      restaurant_id,
      address,
      order_total,
      delivery_fee,
      cutlery_fee,
      packaging_fee,
      app_fee,
      coupon_value,
      coupon_code,
      payment_method_id,
      expected_arrival_time,
      driver_note,
      order_items,
    } = data;

    //validate restaurant exist
    const restaurant =
      await this.commonService.getRestaurantById(restaurant_id);
    if (!restaurant) {
      throw new CustomRpcException(100, 'Restaurant doesnot exist');
    }

    const skuList = [...new Set(order_items.map((i) => i.sku_id))];
    //Validate SKU list belongs to the restaurant
    if (order_items.length > 0) {
      const isValidSkuList =
        await this.commonService.validateSkuListBelongsToRestaurant(
          restaurant_id,
          skuList,
        );
      if (!isValidSkuList) {
        throw new CustomRpcException(
          3,
          'item list does not belong to the resturant',
        );
      }
    }

    //Build OrderSKU data
    const orderItems = await this.buildOrderSKUData(order_items);
    this.logger.debug(orderItems);

    //calculate  delivery fee
    const restaurantAddress = await this.entityManager
      .createQueryBuilder(Address, 'address')
      .where('address.address_id = :address_id', {
        address_id: restaurant.address_id,
      })
      .getOne();
    const deliveryFee = (
      await this.ahamoveService.estimatePrice([
        {
          lat: restaurantAddress.latitude,
          long: restaurantAddress.longitude,
        },
        {
          lat: address.latitude,
          long: address.longitude,
        },
      ])
    )[0].data.total_price;
    this.logger.debug(deliveryFee);
    if (deliveryFee != delivery_fee) {
      console.log(deliveryFee);
      // throw new CustomRpcException(101, 'Delivery fee is not correct');
      throw new CustomRpcException(101, {
        message: 'Delivery fee is not correct',
        delivery_fee: deliveryFee,
      });
    }

    //calculate cutlery_fee
    const orderQuantitySum = order_items
      .map((i) => i.qty_ordered)
      .reduce((sum, current_quan) => (sum += current_quan), 0);
    const cutleryFee = (
      await this.getCutleryFee(restaurant_id, orderQuantitySum)
    ).amount;
    if (cutleryFee != cutlery_fee) {
      // throw new CustomRpcException(102, 'Cutlery fee is not correct');
      throw new CustomRpcException(102, {
        message: 'Cutlery fee is not correct',
        cutlery_fee: cutleryFee,
      });
    }

    //calculate app_fee
    const appFee = await this.getApplicationFee(orderQuantitySum, 1);
    this.logger.log(appFee);
    if (appFee != app_fee) {
      // throw new CustomRpcException(103, 'App fee is not correct');
      throw new CustomRpcException(103, {
        message: 'App fee is not correct',
        app_fee: appFee,
      });
    }

    //get coupon info
    const validCoupon = await this.validateApplyingCouponCode(
      coupon_code,
      restaurant_id,
      skuList,
    );
    if (!validCoupon) {
      throw new CustomRpcException(104, 'Coupon code is invalid');
    }
    const couponAppliedItems: CouponAppliedItem[] = orderItems.map((i) => {
      return {
        sku_id: i.sku_id,
        qty_ordered: i.qty_ordered,
        price_after_discount: i.price,
        packaging_price: i.packaging_obj.price,
      };
    });

    const couponValue: CouponValue = this.calculateDiscountAmount(
      validCoupon,
      couponAppliedItems,
    );
    if (
      couponValue.coupon_value_from_platform +
        couponValue.coupon_value_from_restaurant !=
      coupon_value
    ) {
      throw new CustomRpcException(109, {
        message: 'Coupon value is incorrect',
        coupon_value:
          couponValue.coupon_value_from_platform +
          couponValue.coupon_value_from_restaurant,
      });
    }

    let orderSubTotal = 0;
    let packagingFee = 0;
    for (const item of orderItems) {
      orderSubTotal += item.price * item.qty_ordered;
      packagingFee += item.packaging_obj.price * item.qty_ordered;
    }

    //validate with packaging fee
    if (packagingFee != packaging_fee) {
      throw new CustomRpcException(110, {
        message: 'Packaging fee is incorrect',
        packaging_fee: packagingFee,
      });
    }

    //validate order total
    const orderTotal =
      orderSubTotal +
      deliveryFee +
      packagingFee +
      cutleryFee +
      appFee -
      couponValue.coupon_value_from_platform -
      couponValue.coupon_value_from_restaurant;
    if (orderTotal != order_total) {
      throw new CustomRpcException(111, {
        message: 'Order total is incorrect',
        order_total: orderTotal,
      });
    }

    //get payment info
    const paymentMethod = await this.getPaymentMethodById(payment_method_id);
    if (!paymentMethod) {
      throw new CustomRpcException(113, 'Payment method is invalid');
    }

    //check expected_arrival_time is acceptable
    const skus = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .where('sku.sku_id IN (:...skuList)', { skuList })
      .getMany();

    //Get list Menu Item info from SKU
    const menuItemIds = [...new Set(skus.map((i) => i.menu_item_id))];
    let havingAdvancedCustomization: boolean = false;
    for (const item of order_items) {
      if (
        item.advanced_taste_customization_obj &&
        item.advanced_taste_customization_obj.length > 0
      ) {
        havingAdvancedCustomization = true;
        break;
      }
    }
    const availableDeliveryTime =
      await this.commonService.getAvailableDeliveryTime(
        menuItemIds,
        Date.now(),
        address.longitude,
        address.latitude,
        havingAdvancedCustomization,
      );
    const timeStepInMiliseconds =
      this.configService.get<number>('timeStepInTimSlotConverterM') * 60 * 1000;
    let isValidExpectedArrivalTime = false;
    for (const timeRange of availableDeliveryTime) {
      if (
        timeRange.from - timeStepInMiliseconds <= expected_arrival_time &&
        timeRange.to + timeStepInMiliseconds >= expected_arrival_time
      ) {
        isValidExpectedArrivalTime = true;
        break;
      }
    }
    // if (!isValidExpectedArrivalTime) {
    //   throw new CustomRpcException(112, {
    //     message: 'Invalid expected arrival time',
    //     expected_arrival_time_ranges: availableDeliveryTime,
    //   });
    // }

    //set is_preorder or not
    let isPreorder = false;
    const isToday = this.commonService.isToday(
      expected_arrival_time,
      restaurant.utc_time_zone,
    );
    if (!isToday) {
      isPreorder = true;
    } else if (isToday && havingAdvancedCustomization) {
      isPreorder = true;
    }

    //insert database (with transaction)
    let newOrderId: number;
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // insert data into table Address
      const newAddress = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Address)
        .values({
          address_line: address.address_line,
          ward: address.ward,
          district: address.district,
          city: address.city,
          country: address.country,
          latitude: address.latitude,
          longitude: address.longitude,
        })
        .execute();
      this.logger.log(newAddress.identifiers);
      const newAddressId = Number(newAddress.identifiers[0].address_id);

      // insert data into table Order
      const newOrder = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Order)
        .values({
          customer_id: customer_id,
          restaurant_id: restaurant.restaurant_id,
          address_id: newAddressId,
          order_total: orderTotal,
          delivery_fee: deliveryFee,
          packaging_fee: packagingFee,
          cutlery_fee: cutleryFee,
          app_fee: appFee,
          coupon_value_from_platform: couponValue.coupon_value_from_platform,
          coupon_value_from_restaurant:
            couponValue.coupon_value_from_restaurant,
          coupon_id: validCoupon.coupon_id,
          currency: restaurant.unit,
          is_preorder: isPreorder,
          expected_arrival_time: expected_arrival_time,
          driver_note: driver_note,
        })
        .execute();
      this.logger.log(newOrder.identifiers);
      newOrderId = Number(newOrder.identifiers[0].order_id);

      // insert data into table Order_SKU
      orderItems.forEach((item) => {
        item.order_id = Number(newOrderId);
      });
      const newOrderSkuItems = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(OrderSKU)
        .values(orderItems)
        .execute();
      this.logger.log(newOrderSkuItems.identifiers);

      // insert data into table Order_Status_Log
      // - status NEW
      const newOrderStatus = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(OrderStatusLog)
        .values({
          order_id: newOrderId,
          order_status_id: OrderStatus.NEW,
        })
        .execute();
      this.logger.log(newOrderStatus.identifiers);

      // insert data into table Invoice
      const newInvoice = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(Invoice)
        .values({
          payment_method: payment_method_id,
          total_amount: orderTotal,
          tax_amount: 0,
          discount_amount:
            couponValue.coupon_value_from_platform +
            couponValue.coupon_value_from_restaurant,
          description: '',
          order_id: newOrderId,
          currency: restaurant.unit,
        })
        .execute();
      this.logger.log(newInvoice.identifiers);
      const newInvoiceId = Number(newInvoice.identifiers[0].invoice_id);

      // insert data into table Invoice_Status_History
      // - status STARTED
      const newInvoiceStatus = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(InvoiceStatusHistory)
        .values({
          invoice_id: newInvoiceId,
          status_id: InvoiceHistoryStatusEnum.STARTED,
          note: '',
        })
        .execute();
      this.logger.log(newInvoiceStatus.identifiers);
      this.logger.log(newInvoiceStatus.generatedMaps);
    });

    return await this.getOrderDetail(newOrderId);
  }

  async buildOrderSKUData(items: OrderItemRequest[]): Promise<OrderSKU[]> {
    if (!items || items.length == 0) {
      return [];
    }
    const orderItems: OrderSKU[] = [];

    //Get list SKU info
    const skuIds = [...new Set(items.map((i) => i.sku_id))];
    const skus = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .where('sku.sku_id IN (:...skuIds)', { skuIds })
      .getMany();
    // this.logger.log(skus);

    //Get list Menu Item info from SKU
    const menuItemIds = [...new Set(skus.map((i) => i.menu_item_id))];
    const menuItems = await this.entityManager
      .createQueryBuilder(MenuItem, 'menuItem')
      .leftJoinAndSelect('menuItem.menuItemPackaging_obj', 'menuItemPackaging')
      .leftJoinAndSelect('menuItemPackaging.packaging_obj', 'packaging')
      .where('menuItem.menu_item_id IN (:...menuItemIds)', { menuItemIds })
      .getMany();

    //Cannot order more than available quantity
    for (const menuItem of menuItems) {
      const menuItemWithSkuIds = skus
        .filter((sku) => sku.menu_item_id == menuItem.menu_item_id)
        .map((i) => i.sku_id);
      this.logger.debug(menuItemWithSkuIds);
      const orderingQuantity = items
        .filter((item) => menuItemWithSkuIds.includes(item.sku_id))
        .map((i) => i.qty_ordered)
        .reduce((sum, quantity) => (sum += quantity), 0);
      this.logger.debug(orderingQuantity);
      if (orderingQuantity > menuItem.quantity_available) {
        throw new CustomRpcException(108, {
          message: `Cannot order more than available quantity`,
          menu_item_id: menuItem.menu_item_id,
          quantity_available: menuItem.quantity_available,
        });
      }
    }

    for (const item of items) {
      const sku = skus.find((i) => i.sku_id == item.sku_id);
      const menuItem = menuItems.find(
        (i) => i.menu_item_id == sku.menu_item_id,
      );

      //check package info is valid
      const packaging = menuItem.menuItemPackaging_obj.find(
        (i) => i.packaging_id == item.packaging_id,
      )?.packaging_obj;
      if (!packaging) {
        throw new CustomRpcException(105, {
          message: `Packaging id ${item.packaging_id} is not valid for sku_id ${item.sku_id}`,
          sku_id: item.sku_id,
          packaging_id: item.packaging_id,
        });
      }

      // Check if the advanced_taste_customization_obj is all available to this SKU
      const advancedTasteCustomizationValidation =
        item.advanced_taste_customization_obj.length > 0
          ? await this.commonService.validateAdvacedTasteCustomizationObjWithMenuItem(
              item.advanced_taste_customization_obj,
              sku.menu_item_id,
            )
          : { isValid: true, message: '' };
      if (!advancedTasteCustomizationValidation.isValid) {
        throw new CustomRpcException(106, {
          message: advancedTasteCustomizationValidation.message,
          sku_id: item.sku_id,
        });
      }

      // Check if the basic_taste_customization_obj is all available to this SKU
      const basicTasteCustomizationValidation =
        item.basic_taste_customization_obj.length > 0
          ? await this.commonService.validateBasicTasteCustomizationObjWithMenuItem(
              item.basic_taste_customization_obj,
              sku.menu_item_id,
            )
          : { isValid: true, message: '' };
      if (!basicTasteCustomizationValidation.isValid) {
        throw new CustomRpcException(107, {
          message: basicTasteCustomizationValidation.message,
          sku_id: item.sku_id,
        });
      }

      //Buil output
      const orderSku = new OrderSKU();
      orderSku.sku_id = item.sku_id;
      orderSku.qty_ordered = item.qty_ordered;
      orderSku.price = await this.commonService.getAvailableDiscountPrice(sku);
      orderSku.advanced_taste_customization =
        item.advanced_taste_customization_obj.length > 0
          ? await this.commonService.interpretAdvanceTaseCustomization(
              item.advanced_taste_customization_obj,
            )
          : '';
      orderSku.basic_taste_customization =
        item.basic_taste_customization_obj.length > 0
          ? await this.commonService.interpretBasicTaseCustomization(
              item.basic_taste_customization_obj,
            )
          : '';
      orderSku.portion_customization =
        await this.commonService.interpretPortionCustomization(item.sku_id);
      orderSku.advanced_taste_customization_obj =
        item.advanced_taste_customization_obj.length > 0
          ? JSON.stringify(item.advanced_taste_customization_obj)
          : '';
      orderSku.basic_taste_customization_obj =
        item.basic_taste_customization_obj.length > 0
          ? JSON.stringify(item.basic_taste_customization_obj)
          : '';
      orderSku.notes = item.notes;
      orderSku.packaging_id = item.packaging_id;
      orderSku.calorie_kcal = sku.calorie_kcal;
      orderSku.packaging_obj = packaging;

      orderItems.push(orderSku);
    }

    return orderItems;
  }

  async getPaymentMethodById(
    payment_method_id: number,
  ): Promise<PaymentOption> {
    return await this.entityManager
      .createQueryBuilder(PaymentOption, 'payment')
      .where('payment.option_id = :payment_method_id', {
        payment_method_id,
      })
      .getOne();
  }

  async getOrderDetail(order_id): Promise<OrderDetailResponse | undefined> {
    console.log(order_id);
    if (!order_id) {
      return undefined;
    }
    const order = await this.entityManager
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.order_status_log', 'orderStatusLog')
      .leftJoinAndSelect('orderStatusLog.order_status_ext', 'orderStatusExt')
      .leftJoinAndSelect('order.invoice_obj', 'invoice')
      .leftJoinAndSelect('invoice.history_status_obj', 'invoiceHistory')
      .leftJoinAndSelect(
        'invoiceHistory.invoice_status_ext',
        'invoiceStatusExt',
      )
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('order.address_obj', 'address')
      .where('order.order_id = :order_id', { order_id })
      .getOne();

    if (!order) {
      return undefined;
    }
    console.log(order);

    //Get restaurant info
    const skuId = order.items[0].sku_id;
    const sku = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.menu_item', 'menuItem')
      .where('sku.sku_id = :skuId', { skuId })
      .getOne();
    const restaurant = await this.commonService.getRestaurantBasicInfo(
      sku.menu_item.restaurant_id,
    );

    //Get driver info
    const driver = await this.entityManager
      .createQueryBuilder(DriverStatusLog, 'driverLog')
      .leftJoinAndSelect('driverLog.driver', 'driver')
      .leftJoinAndSelect('driver.profile_image_obj', 'profileImg')
      .where('driverLog.order_id = :order_id', { order_id })
      .orderBy('driverLog.logged_at', 'DESC')
      .getOne();

    const orderDetail: OrderDetailResponse = {
      order_id: order.order_id,
      customer_id: order.customer_id,
      restaurant: {
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
        restaurant_logo_img: restaurant.logo_url,
      },
      address: {
        address_line: order.address_obj.address_line,
        ward: order.address_obj.ward,
        district: order.address_obj.district,
        city: order.address_obj.city,
        country: order.address_obj.country,
        latitude: order.address_obj.latitude,
        longitude: order.address_obj.longitude,
      },
      driver_note: order.driver_note,
      // driver: Driver;
      // order_total: number;
      // delivery_fee: number;
      // packaging_fee: number;
      // cutlery_fee: number;
      // app_fee: number;
      // coupon_value: number;
      // coupon_id: number;
      // invoice_id: number;
      // payment_method: Payment;
      // payment_status_history: PaymentStatusHistory[];
      // is_preorder: boolean;
      // expected_arrival_time: number;
      // order_items: OrderItemResponse[];
      // order_status_log: OrderStatusLog[];
    };

    return new OrderDetailResponse();
  }
}
