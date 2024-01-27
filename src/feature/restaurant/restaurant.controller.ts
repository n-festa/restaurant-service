import { Controller, HttpException, Inject } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GetRestaurantDetailRequest } from './dto/get-restaurant-detail-request.dto';
import { GetRestaurantDetailResponse } from './dto/get-restaurant-detail-response.dto';

@Controller()
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
  ) {}

  @MessagePattern({ cmd: 'get_restaurant_details' })
  async getRestaurantDetails(
    data: GetRestaurantDetailRequest,
  ): Promise<GetRestaurantDetailResponse> {
    const { restaurant_id, lat, long } = data;
    const res = new GetRestaurantDetailResponse(200, '');
    try {
      const restaurantDetail =
        await this.restaurantService.getRestaurantDetailsFromEndPoint(
          restaurant_id,
          lat,
          long,
        );
      res.statusCode = 200;
      res.message = 'Getting Restaurant Details Successfully';
      res.data = restaurantDetail;
    } catch (error) {
      if (error instanceof HttpException) {
        res.statusCode = error.getStatus();
        res.message = error.getResponse();
        res.data = null;
      } else {
        res.statusCode = 500;
        res.message = error.toString();
        res.data = null;
      }
    }

    return res;
  } // getRestaurantDetails
}
