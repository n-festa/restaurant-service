import { Injectable, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { Between, Repository } from 'typeorm';
import { RestaurantRecommendationRequest } from './dto/restaurant-recommendation-request.dto';
import { RestaurantDTO } from './dto/restaurant.dto';
import { AhamoveService } from 'src/intergration/ahamove/ahamove.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    private readonly ahamoveService: AhamoveService,
  ) {}
  async getGeneralRestaurantRecomendation(
    lat,
    long,
    lang: string = 'vie',
  ): Promise<any> {
    let restaurantList: RestaurantDTO[] = [];
    const restaurants = await this.getRestaurantByRadius(lat, long, 5000);
    // restaurants.forEach(async (restaurant) => {
    for (const restaurant of restaurants) {
      console.log(restaurant.unit_obj);
      const restaurantExt = restaurant.restaurant_ext.find(
        (ext) => ext.ISO_language_code === lang,
      );
      const timeAnhDistance = await this.ahamoveService.estimateTimeAndDistance(
        {
          lat: lat,
          long: long,
        },
        {
          lat: Number(restaurant.address.latitude),
          long: Number(restaurant.address.longitude),
        },
      );
      const restaurantDTO: RestaurantDTO = {
        id: restaurant.restaurant_id,
        intro_video: restaurant.intro_video_obj.url,
        logo_img: restaurant.logo.url,
        name: restaurantExt.name,
        rating: restaurant.rating, //???
        distance: timeAnhDistance.distance, //km
        delivery_time: timeAnhDistance.duration, //minutes
        specialty: restaurantExt.specialty,
        top_food: restaurant.top_food, //???
        promotion: restaurant.promotion, //???
        cutoff_time: null, //??? calculate
        having_vegeterian_food: null, //??calculate
        max_price: null, //???calculate
        min_price: null, //???calculate
        unit: restaurant.unit_obj.symbol, //???
      };
      console.log(restaurantDTO);
      restaurantList.push(restaurantDTO);
    }

    return restaurantList;
  }
  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepo.find();
  }

  async getRestaurantByRadius(
    lat: number,
    long: number,
    radius: number, //meter
  ): Promise<Restaurant[]> {
    //
    const EARTH_CIRCUMFERENCE_AT_EQUATOR = 40075884; //meter
    //1 degree of latitude = 111,111 meter
    const ONE_LATITUDE_DEGREE_DISTANCE = 111111; //meter
    //1 degree of longitude = cosine (latitude in radians) * length of degree at equator
    const ONE_LONGITUDE_DEGREE_DISTANCE =
      Math.cos((lat * Math.PI) / 180) * (EARTH_CIRCUMFERENCE_AT_EQUATOR / 360); //meter

    let search_area = {
      latMin: lat - radius / ONE_LATITUDE_DEGREE_DISTANCE,
      latMax: lat + radius / ONE_LATITUDE_DEGREE_DISTANCE,
      longMin: long - radius / ONE_LONGITUDE_DEGREE_DISTANCE,
      longMax: long + radius / ONE_LONGITUDE_DEGREE_DISTANCE,
    };
    return await this.restaurantRepo.find({
      where: {
        address: {
          latitude: Between(search_area.latMin, search_area.latMax),
          longitude: Between(search_area.longMin, search_area.longMax),
        },
      },
    });
  }
}
