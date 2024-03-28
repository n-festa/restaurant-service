import { Controller, Inject, UseFilters } from '@nestjs/common';
import { ClientProxy, MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/entity/order.entity';
import { Repository } from 'typeorm';
import { OrderService } from './order.service';
import { GetApplicationFeeRequest } from './dto/get-application-fee-request.dto';
import { CustomRpcExceptionFilter } from 'src/filters/custom-rpc-exception.filter';
import { GetApplicationFeeResponse } from './dto/get-application-fee-response.dto';
import { GetPaymentMethodResponse } from './dto/get-payment-method-response.dto';
import { GetCutleryFeeRequest } from './dto/get-cutlery-fee-request.dto';
import { GetCutleryFeeResponse } from './dto/get-cutlery-fee-response.dto';
import { CommonService } from '../common/common.service';
import { CouponValue, MoneyType } from 'src/type';
import { GetCouponInfoRequest } from './dto/get-coupon-info-request.dto';
import { GetCouponInfoResponse } from './dto/get-coupon-info-response.dto';
import { Coupon } from 'src/entity/coupon.entity';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { ApplyPromotionCodeRequest } from './dto/apply-promotion-code-request.dto';
import { ApplyPromotionCodeResponse } from './dto/apply-promotion-code-response.dto';
import { CreateOrderRequest } from './dto/create-order-request.dto';
import { CreateOrderResponse } from './dto/create-order-response.dto';
import { OrderDetailResponse } from './dto/order-detail-response.dto';
import { GetDeliveryFeeRequest } from './dto/get-delivery-fee-request.dto';
import { GetDeliveryFeeResonse } from './dto/get-delivery-fee-response.dto';
import { GetOngoingOrdersResponse } from './dto/get-ongoing-orders-response.dto';
import { GetOrderHistoryByRestaurantRequest } from './dto/get-order-history-by-restaurant-request.dto';
import { GetOrderHistoryByRestaurantResponse } from './dto/get-order-history-by-restaurant-response.dto';

@Controller('order')
export class OrderController {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private readonly orderService: OrderService,
    private readonly commonService: CommonService,
    @Inject('GATEWAY_SERVICE')
    private readonly gatewayClient: ClientProxy,
  ) {}
  @MessagePattern({ cmd: 'get_order_by_id' })
  async getOrderByOrderId(order_id) {
    return this.orderRepo.findOne({ where: { order_id } });
  }

  @MessagePattern({ cmd: 'update_order_status_by_webhook' })
  async updateOrderStatusByWebhook({ delivery_order_id, webhookData }) {
    return await this.orderService.updateOrderStatusFromAhamoveWebhook(
      delivery_order_id,
      webhookData,
    );
  }

  @MessagePattern({ cmd: 'get_application_fee' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getApplicationFee(
    data: GetApplicationFeeRequest,
  ): Promise<GetApplicationFeeResponse> {
    const { items_total, exchange_rate } = data;
    const applicationFee = await this.orderService.getApplicationFee(
      items_total,
      exchange_rate,
    );

    return {
      application_fee: applicationFee,
    };
  }

  @MessagePattern({ cmd: 'get_payment_method' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getPaymentMethod(): Promise<GetPaymentMethodResponse> {
    const result: GetPaymentMethodResponse = {
      data: [],
    };

    const paymentOption = await this.orderService.getPaymentOptions();
    paymentOption.forEach((item) => {
      result.data.push({
        payment_id: item.option_id,
        name: item.name,
      });
    });
    return result;
  }

  @MessagePattern({ cmd: 'get_cutlery_fee' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getCutleryFee(
    data: GetCutleryFeeRequest,
  ): Promise<GetCutleryFeeResponse> {
    const result = new GetCutleryFeeResponse();

    const { restaurant_id, item_quantity } = data;

    const fee: MoneyType = await this.orderService.getCutleryFee(
      restaurant_id,
      item_quantity,
    );

    result.cutlery_fee = fee.amount;
    result.currency = fee.currency;

    return result;
  }

  @MessagePattern({ cmd: 'get_coupon_info' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getCouponInfo(
    data: GetCouponInfoRequest,
  ): Promise<GetCouponInfoResponse> {
    const { restaurant_id, sku_ids } = data;
    const result: GetCouponInfoResponse = { coupons: [] };

    //Validate restaurant exist
    const restaurant =
      await this.commonService.getRestaurantById(restaurant_id);
    if (!restaurant) {
      throw new CustomRpcException(2, 'Restaurant doesnot exist');
    }

    //Validate SKU list belongs to the restaurant
    if (sku_ids.length > 0) {
      const isValidSkuList =
        await this.commonService.validateSkuListBelongsToRestaurant(
          restaurant_id,
          sku_ids,
        );
      if (!isValidSkuList) {
        throw new CustomRpcException(
          3,
          'SKU list doesnot belong to the restaurant',
        );
      }
    }

    //Get restaurant coupon
    const restaurantCoupons: Coupon[] =
      await this.orderService.getCouponInfoWithRestaurntIds([restaurant_id]);

    restaurantCoupons.forEach((i) => {
      result.coupons.push({
        coupon_code: i.coupon_code,
        name: i.name,
        description: i.description,
      });
    });

    //get sku coupon
    const skuCoupons: Coupon[] =
      await this.orderService.getCouponInfoWithSkus(sku_ids);

    skuCoupons.forEach((i) => {
      result.coupons.push({
        coupon_code: i.coupon_code,
        name: i.name,
        description: i.description,
      });
    });

    return result;
  }

  @MessagePattern({ cmd: 'apply_promotion_code' })
  @UseFilters(new CustomRpcExceptionFilter())
  async applyPromotionCode(
    data: ApplyPromotionCodeRequest,
  ): Promise<ApplyPromotionCodeResponse> {
    const { coupon_code, restaurant_id, items } = data;
    const result = new ApplyPromotionCodeResponse();
    const skuIds = items.map((i) => i.sku_id);
    //Validate restaurant exist
    const restaurant =
      await this.commonService.getRestaurantById(restaurant_id);
    if (!restaurant) {
      throw new CustomRpcException(2, 'Restaurant doesnot exist');
    }

    //Validate SKU list belongs to the restaurant
    if (items.length > 0) {
      const isValidSkuList =
        await this.commonService.validateSkuListBelongsToRestaurant(
          restaurant_id,
          skuIds,
        );
      if (!isValidSkuList) {
        throw new CustomRpcException(
          3,
          'item list does not belong to the resturant',
        );
      }
    }
    const validCoupon = await this.orderService.validateApplyingCouponCode(
      coupon_code,
      restaurant_id,
      skuIds,
    );
    if (!validCoupon) {
      throw new CustomRpcException(4, 'Coupon code is invalid');
    }

    const couponValue: CouponValue = this.orderService.calculateDiscountAmount(
      validCoupon,
      items,
    );

    const unit = await this.orderService.getUnitById(restaurant.unit);

    result.discount_amount =
      couponValue.coupon_value_from_platform +
      couponValue.coupon_value_from_restaurant;
    result.currency = unit.symbol;
    result.coupon_code = coupon_code;
    result.restaurant_id = restaurant_id;
    result.items = items;

    return result;
  }

  @MessagePattern({ cmd: 'create_order' })
  @UseFilters(new CustomRpcExceptionFilter())
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    return await this.orderService.createOrder(data);
  }

  @MessagePattern({ cmd: 'get_order_detail' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getOrderDetail(
    data: OrderDetailResponse,
  ): Promise<OrderDetailResponse> {
    const { order_id, customer_id } = data;
    const order = await this.orderService.getOrderDetail(order_id);

    if (!order) {
      throw new CustomRpcException(2, 'Order cannot be found');
    }

    if (order.customer_id && customer_id != order.customer_id) {
      throw new CustomRpcException(3, "Cannot get other customer's order");
    }

    return order;
  }

  @MessagePattern({ cmd: 'get_delivery_fee' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getDeliveryFee(
    data: GetDeliveryFeeRequest,
  ): Promise<GetDeliveryFeeResonse> {
    const { restaurant_id, delivery_latitude, delivery_longitude } = data;

    return await this.orderService.getDeliveryFeeFromEndPoint(
      restaurant_id,
      delivery_latitude,
      delivery_longitude,
    );
  }

  @MessagePattern({ cmd: 'get_order_detail_sse' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getOrderDetailSse(data: any): Promise<OrderDetailResponse> {
    const { order_id } = data;
    const order = await this.orderService.getOrderDetail(order_id);
    return order;
  }

  @MessagePattern({ cmd: 'confirm_order_from_restaurant' })
  @UseFilters(new CustomRpcExceptionFilter())
  async confirmOrder(data: any) {
    const { order_id } = data;
    await this.orderService.confirmOrder(order_id);
    this.gatewayClient.emit('order_updated', {
      order_id: order_id,
    });
    return { message: 'confirm order from restaurant successfully' };
  }

  @MessagePattern({ cmd: 'change_order_status_for_testing' })
  @UseFilters(new CustomRpcExceptionFilter())
  async changeOrderStatusForTesting(data: any) {
    const { order_id, new_order_status } = data;
    const record = await this.orderService.setOrderStatus(
      order_id,
      new_order_status,
    );
    this.gatewayClient.emit('order_updated', {
      order_id: order_id,
    });
    return record;
  }

  @MessagePattern({ cmd: 'get_customer_ongoing_orders' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getCustomerOngoingOrders(
    customer_id: number,
  ): Promise<GetOngoingOrdersResponse> {
    const ongoingOrders: Order[] =
      await this.orderService.getOngoingOrders(customer_id);

    return await this.orderService.buildGetOngoingOrdersResponse(ongoingOrders);
  }

  @MessagePattern({ cmd: 'get_order_history_by_restaurant' })
  @UseFilters(new CustomRpcExceptionFilter())
  async getOrderHistoryByRestaurant(
    data: GetOrderHistoryByRestaurantRequest,
  ): Promise<GetOrderHistoryByRestaurantResponse> {
    const result = new GetOrderHistoryByRestaurantResponse();

    const {
      customer_id,
      search_keyword,
      sort_type,
      filtered_order_status,
      time_range,
      offset,
      page_size,
    } = data;

    const historyOrders: Order[] = await this.orderService.getHistoryOrders(
      customer_id,
      search_keyword,
      sort_type,
      filtered_order_status,
      time_range,
    );

    const historicalOrdersByRestaurant =
      await this.orderService.buildHistoricalOrderByRestaurant(
        historyOrders.slice(offset, offset + page_size),
      );

    result.hitorical_oders = historicalOrdersByRestaurant;
    result.sort_type = sort_type;
    result.filtered_order_status = filtered_order_status;
    result.time_range = time_range;
    result.offset = offset + historicalOrdersByRestaurant.length;
    result.total_count = historyOrders.length;
    result.search_keyword = search_keyword;
    return result;
  }
}
