import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Coordinate } from 'src/type';
import { FlagsmithService } from '../flagsmith/flagsmith.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AhamoveOrder, PostAhaOrderRequest } from './dto/ahamove.dto';
import postAhaOrderRequestSchema, {
  coordinateListSchema,
} from './schema/ahamove.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AhamoveOrderEntity } from 'src/entity/ahamove-order.entity';
import { AhamoveMapper } from './mapper/ahamove.mapper';
import { AhamoveOrderHookEntity } from 'src/entity/ahamove-order-hook.entity';
import { OrderService } from 'src/feature/order/order.service';

@Injectable()
export class AhamoveService implements OnModuleInit {
  AHA_MOVE_BASE_URL: string = '';
  AHA_MOVE_API_KEY: string = '';
  AHA_MOVE_MOBILE: string = '';
  AHA_MOVE_USERNAME: string = '';
  AHA_MOVE_TOKEN: string = '';
  AHA_MOVE_REFRESH_TOKEN: string = '';
  ON_WHEEL_SERVICE_NAME: string = 'VNM-PARTNER-2ALL';
  SGN_EXPRESS_SERVICE_NAME: string = 'SGN-EXPRESS';
  REQUEST_ID: string = 'SGN-EXPRESS-TRANSFER-COD';
  private readonly logger = new Logger(AhamoveService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject('FLAGSMITH_SERVICE') private flagService: FlagsmithService,
    private configService: ConfigService,
    @InjectRepository(AhamoveOrderEntity)
    private ahamoveOrder: Repository<AhamoveOrderEntity>,
    @InjectRepository(AhamoveOrderHookEntity)
    private ahamoveOrderHook: Repository<AhamoveOrderHookEntity>,
  ) {
    this.AHA_MOVE_BASE_URL =
      configService.get('ahamove.baseUrl') || 'https://apistg.ahamove.com';
    this.AHA_MOVE_API_KEY =
      configService.get('ahamove.apiKey') ||
      '7bbc5c69e7237f267e97f81237a717c387f13bdb';
    this.AHA_MOVE_USERNAME =
      configService.get('ahamove.username') || '2ALL Admin';
    this.AHA_MOVE_MOBILE = configService.get('ahamove.mobile') || '84905005248';
  }

  async onModuleInit() {
    await this.getAhamoveAccessToken();
  }

  async getAhamoveAccessToken() {
    let data = JSON.stringify({
      mobile: this.AHA_MOVE_MOBILE,
      name: this.AHA_MOVE_USERNAME,
      api_key: this.AHA_MOVE_API_KEY,
    });

    let config = {
      method: 'post',
      url: `${this.AHA_MOVE_BASE_URL}/api/v3/partner/account/register`,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        this.logger.log('getting token', response.data);
        this.AHA_MOVE_TOKEN = response.data?.token;
        this.AHA_MOVE_REFRESH_TOKEN = response.data?.refresh_token;
      })
      .catch((error) => {
        // console.log(error);
        this.logger.error('An error occurred ', JSON.stringify(error));
      });
  }

  async estimateTimeAndDistance(
    startingPoint: Coordinate,
    destination: Coordinate,
  ) {
    try {
      const data: any = JSON.stringify({
        order_time: 0,
        path: [
          {
            lat: Number(startingPoint.lat),
            lng: Number(startingPoint.long),
            address: 'starting point',
          },
          {
            lat: Number(destination.lat),
            lng: Number(destination.long),
            address: 'destination',
          },
        ],
        services: [
          {
            _id: 'SGN-EXPRESS',
          },
        ],
        payment_method: 'BALANCE',
        requests: [
          {
            _id: 'SGN-EXPRESS-TRANSFER-COD',
          },
        ],
      });
      const config: AxiosRequestConfig = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://apistg.ahamove.com/api/v3/partner/order/estimate',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.AHA_MOVE_TOKEN}`,
        },
        data: data,
      };
      // console.log(config);
      const request = this.httpService.request(config);

      const result = await firstValueFrom(request);
      this.logger.log(result.data);
      return {
        distance_km: result.data[0].data.distance,
        duration_s: result.data[0].data.duration,
      };
    } catch (error) {
      this.logger.error('An error occurred ', JSON.stringify(error));
      return {
        distance_km: null,
        duration_s: null,
      };
    }
  }

  async estimatePrice(coordinates: Coordinate[]) {
    const { error, value } = await coordinateListSchema.validate(coordinates);
    if (error) {
      this.logger.warn('Bad coordinates: ' + coordinates);
      throw new BadRequestException(
        error?.details.map((x) => x.message).join(', '),
      );
    }
    const startingPoint = coordinates[0];
    const destination = coordinates[1];
    const data: any = JSON.stringify({
      order_time: 0,
      path: [
        {
          lat: Number(startingPoint.lat),
          lng: Number(startingPoint.long),
          address: 'starting point',
        },
        {
          lat: Number(destination.lat),
          lng: Number(destination.long),
          address: 'destination',
        },
      ],
      services: [
        {
          _id: 'VNM-PARTNER-2ALL',
        },
      ],
      payment_method: 'BALANCE',
      requests: [
        {
          _id: 'SGN-EXPRESS-TRANSFER-COD',
        },
      ],
    });
    const config: AxiosRequestConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.AHA_MOVE_BASE_URL}/api/v3/partner/order/estimate`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.AHA_MOVE_TOKEN}`,
      },
      data: data,
    };
    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      this.logger.error(
        'Error occurred while call to get estimate: ' + JSON.stringify(error),
      );
      throw new InternalServerErrorException(error);
    }
  }

  async postAhamoveOrder(order: PostAhaOrderRequest) {
    let serviceType = this.SGN_EXPRESS_SERVICE_NAME;

    if (order.serviceType === this.ON_WHEEL_SERVICE_NAME) {
      serviceType = this.ON_WHEEL_SERVICE_NAME;
    }
    const orderRequest = await this.#buildAhamoveRequest(order, serviceType);
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${this.AHA_MOVE_BASE_URL}/api/v3/partner/order/create`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.AHA_MOVE_TOKEN}`,
      },
      data: JSON.stringify(orderRequest),
    };
    try {
      const { data } = await axios.request(config);
      // update order id and response from ahamove
      orderRequest.order_id = data.order_id;
      orderRequest.shared_link = data.shared_link;
      orderRequest.response = data;
      const result = await this.ahamoveOrder.save(
        AhamoveMapper.fromDTOtoEntity(orderRequest),
      );
      this.logger.verbose('created ahamove order', JSON.stringify(result));
      return data;
    } catch (error) {
      this.logger.error(
        'An error occurred while calling post ahamove order',
        JSON.stringify(error),
      );
      throw new InternalServerErrorException('An error occurred');
    }
  }

  async getAhamoveOrderByOrderId(orderId: string): Promise<AhamoveOrderEntity> {
    const result = await this.ahamoveOrder.findOne({
      where: { order_id: orderId },
    });
    return result;
  }

  async saveAhamoveTrackingWebhook(order) {
    const result = await this.ahamoveOrderHook.save(order);
    return result;
  }

  async #buildAhamoveRequest(
    order: PostAhaOrderRequest,
    service_type: string,
  ): Promise<AhamoveOrder> {
    try {
      await postAhaOrderRequestSchema.validate(order);
    } catch (error) {
      this.logger.error('An error occurred ', JSON.stringify(error));
      throw new BadRequestException(error?.message);
    }
    const result = {
      service_id: service_type,
      path: [order.startingPoint, order.destination],
      payment_method: order.paymentMethod || 'BALANCE',
      total_pay: order.totalPay || 0,
      order_time: order.orderTime || 0,
      promo_code: order.promoCode || null,
      remarks: order.remarks || '',
      admin_note: order.adminNote || '',
      route_optimized: false,
      idle_until: 0,
      items: order.items,
      group_service_id: null,
      group_requests: null,
      package_detail: order.packageDetails,
    } as unknown as AhamoveOrder;
    if (service_type === this.SGN_EXPRESS_SERVICE_NAME) {
      result.requests = [{ _id: this.REQUEST_ID }];
    }
    return result;
  }

  async cancelAhamoveOrder(orderId, cancelReasonMessage) {
    cancelReasonMessage =
      cancelReasonMessage || 'supplier_sender_ask_to_return_the_package';
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `${this.AHA_MOVE_BASE_URL}/v1/order/cancel?token=${this.AHA_MOVE_TOKEN}&order_id=${orderId}&comment=${cancelReasonMessage}`,
      headers: {
        'cache-control': 'no-cache',
      },
    };
    try {
      const result = await axios.request(config);
      return result;
    } catch (error) {
      this.logger.error('An error occurred ', JSON.stringify(error));
      throw new InternalServerErrorException(error?.message);
    }
  }
}
