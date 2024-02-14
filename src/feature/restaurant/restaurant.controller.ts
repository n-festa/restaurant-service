import { Controller, HttpException, Inject } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { MessagePattern } from '@nestjs/microservices';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GetRestaurantDetailRequest } from './dto/get-restaurant-detail-request.dto';
import { GetRestaurantDetailResponse } from './dto/get-restaurant-detail-response.dto';
import { SendContactFormRequest } from './dto/send-contact-form-request.dto';
import { SendContactFormResponse } from './dto/send-contact-form-response.dto';
import { CommonService } from '../common/common.service';

@Controller()
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    private readonly commonService: CommonService,
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

  @MessagePattern({ cmd: 'send_contact_form' })
  async sendContactForm(
    data: SendContactFormRequest,
  ): Promise<SendContactFormResponse> {
    const res = new SendContactFormResponse(200, '');
    const { email, message } = data;
    try {
      if (!email) {
        throw new HttpException('Email is required', 400);
      }
      if (!message) {
        throw new HttpException('Message is required', 400);
      }

      //Validate Email Format
      if (!this.commonService.validateEmail(email)) {
        throw new HttpException('Invalid Email Format', 400);
      }

      //Process data
      const conact_id =
        await this.restaurantService.sendContactFormFromEndPoint(
          email,
          message,
        );
      res.statusCode = 200;
      res.message = 'Sending Contact Form Successfully';
      res.data = conact_id;
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
  } // end of sendContactForm
}
