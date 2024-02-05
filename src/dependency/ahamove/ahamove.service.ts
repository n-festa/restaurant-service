import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosRequestConfig } from 'axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { Coordinate } from 'src/type';
import { FlagsmithService } from '../flagsmith/flagsmith.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AhamoveService {
  constructor(
    private readonly httpService: HttpService,
    @Inject('FLAGSMITH_SERVICE') private flagService: FlagsmithService,
    private configService: ConfigService,
  ) {}

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
          Authorization: `Bearer ${this.configService.get<string>(
            'ahamoveToken',
          )}`,
        },
        data: data,
      };
      // console.log(config);
      const request = this.httpService.request(config);

      const result = await firstValueFrom(request);
      // console.log(result.data);
      return {
        distance_km: result.data[0].data.distance,
        duration_s: result.data[0].data.duration,
      };
    } catch (error) {
      console.log(error);
      return {
        distance_km: null,
        duration_s: null,
      };
    }
  }
}
