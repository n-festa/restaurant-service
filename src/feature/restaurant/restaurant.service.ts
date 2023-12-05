import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { AhamoveService } from 'src/intergration/ahamove/ahamove.service';
import { RestaurantByRadius } from 'src/type';
import { Between, Repository } from 'typeorm';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    private readonly ahamoveService: AhamoveService,
  ) {}

  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepo.find();
  }

  async getRestaurantByRadius(
    lat: number,
    long: number,
    radius: number, //meter
  ): Promise<RestaurantByRadius[]> {
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
    const restaurants = await this.restaurantRepo.find({
      where: {
        address: {
          latitude: Between(search_area.latMin, search_area.latMax),
          longitude: Between(search_area.longMin, search_area.longMax),
        },
      },
    });
    const restaurantsByRadius: RestaurantByRadius[] = [];
    for (const restaurant of restaurants) {
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
      restaurantsByRadius.push({
        ...restaurant,
        menu_items: restaurant.menu_items,
        distance_km: timeAnhDistance.distance_km,
        delivery_time_s: timeAnhDistance.duration_s,
      });
    }
    return restaurantsByRadius;
  }
}
