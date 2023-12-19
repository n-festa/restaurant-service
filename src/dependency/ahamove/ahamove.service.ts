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
      if (this.flagService.isFeatureEnabled('fes-14-update-ahamove-service')) {
        const data: any = JSON.stringify({
          order_time: 0,
          path: [
            {
              lat: startingPoint.lat,
              lng: startingPoint.long,
              address: 'starting point',
            },
            {
              lat: destination.lat,
              lng: destination.long,
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
      } else {
        let data: any = JSON.stringify({
          token:
            'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhaGEiLCJ0eXAiOiJ1c2VyIiwiY2lkIjoiODQ5MDUwMDUyNDgiLCJzdGF0dXMiOiJPTkxJTkUiLCJlb2MiOiJjb25uZWN0QDJhbGwuY29tLnZuIiwibm9jIjoiMkFMTCBBZG1pbiIsImN0eSI6IlNHTiIsImFjY291bnRfc3RhdHVzIjoiQUNUSVZBVEVEIiwiZXhwIjoxNzMzNzUwODYzLCJwYXJ0bmVyIjoiMmFsbCIsInR5cGUiOiJhcGkifQ.Li57O_w-i5Ai33vKLPNYpWPxrJzQG7-Uk2dIcToqgKI',
          order_time: 0,
          path: [
            {
              lat: startingPoint.lat,
              lng: startingPoint.long,
              address: 'starting point',
            },
            {
              lat: destination.lat,
              lng: destination.long,
              address: 'destination',
            },
          ],
          services: [
            {
              _id: 'SGN-EXPRESS',
            },
          ],
          payment_method: 'BALANCE',
        });

        let config: AxiosRequestConfig = {
          method: 'post',
          maxBodyLength: Infinity,
          url: 'https://apistg.ahamove.com/v2/order/estimated_fee',
          headers: {
            conten: 'application/json',
            'Content-Type': 'application/json',
          },
          data: data,
        };
        // console.log(config);
        const request = this.httpService.request(config);

        const result = await firstValueFrom(request);
        // console.log(result.data);
        return {
          distance_km: result.data[0].distance, //km
          duration_s: result.data[0].duration, //minutes
        };
      }
    } catch (error) {
      if (this.flagService.isFeatureEnabled('fes-14-update-ahamove-service')) {
        console.log(error);
        return {
          distance_km: null,
          duration_s: null,
        };
      } else {
        console.log(error);
        throw new Error(error.message);
      }
    }
  }
}
