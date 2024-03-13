import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { CouponFilterType, CouponType, OrderStatus } from 'src/enum';
import { EntityManager, Repository } from 'typeorm';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';
import { PaymentOption } from 'src/entity/payment-option.entity';
import { MoneyType } from 'src/type';
import { Restaurant } from 'src/entity/restaurant.entity';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { Coupon } from 'src/entity/coupon.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
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
      if (currentOrder) {
        const {
          status,
          cancel_time,
          sub_status,
          pickup_time,
          complete_time,
          fail_time,
          return_time,
          processing_time,
          accept_time,
        } = webhookData;
        const ahavemoveData = {
          status,
          accept_time,
          cancel_time,
          pickup_time,
          complete_time,
          fail_time,
          return_time,
          sub_status,
          processing_time,
          path_status: '',
        };
        ahavemoveData.path_status = webhookData?.path?.status;
        const orderData = {
          order_pickup_time: currentOrder.pickup_time,
          is_preorder: currentOrder.is_preorder,
          ready_time: currentOrder.ready_time,
        };
        const updateData = this.getOrderStatusBaseOnAhahaStatus(
          orderData,
          ahavemoveData,
        );
        this.logger.log(
          `Updating data from webhook to ${orderId} with ${JSON.stringify(
            updateData,
          )}`,
        );
        await this.orderRepo.update(currentOrder.order_id, {
          ...currentOrder,
          ...updateData,
        });
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
  private getOrderStatusBaseOnAhahaStatus(
    { order_pickup_time, is_preorder, ready_time },
    {
      status,
      sub_status,
      path_status,
      accept_time,
      cancel_time,
      pickup_time,
      complete_time,
      fail_time,
      return_time,
      processing_time,
    },
  ) {
    let data = {};
    switch (status) {
      case 'ASSIGNING':
        if (!is_preorder) {
          data = {
            order_status_id: OrderStatus.PROCESSING,
            processing_time,
          };
        } else if (is_preorder) {
          data = {};
        }
        break;
      case 'ACCEPTED':
        data = {
          driver_accept_time: accept_time,
        };
        break;
      case 'CANCELLED':
        data = {
          driver_cancel_time: cancel_time,
        };
        break;
      // case 'CANCELLED':
      //   data = {
      //     cancel_time,
      //   };
      //   break;
      case 'IN PROCESS':
        if (path_status === 'FAILED') {
          data = {};
        } else {
          if (pickup_time) {
            data = {
              order_status_id: OrderStatus.DELIVERING,
              pickup_time: pickup_time,
              ready_time: !ready_time ? pickup_time : ready_time, // if ready_time is null or equal = 0
            };
          } else if (!pickup_time) {
            data = {};
          }
        }
        break;
      case 'COMPLETED':
        if (path_status === 'FAILED') {
          data = {
            order_status_id: OrderStatus.FAILED,
            fail_time,
          };
        } else if (path_status === 'RETURNED') {
          data = {
            return_time,
          };
        } else if (sub_status === 'COMPLETED') {
          data = {
            order_status_id: OrderStatus.COMPLETED,
            completed_time: complete_time,
          };
        } else {
          // data = {
          //   order_status_id: OrderStatus.COMPLETED,
          //   completed_time: complete_time,
          // };
          data = {};
        }
        break;
      default:
        this.logger.log('The value does not match any case');
        break;
    }
    return data;
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
}
