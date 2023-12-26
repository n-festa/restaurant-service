import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { DeliveryRestaurant, PriceRange, TextByLang } from 'src/type';
import { Between, EntityManager, In, Repository } from 'typeorm';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';

@Injectable()
export class RestaurantService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    private readonly ahamoveService: AhamoveService,
    @InjectEntityManager() private entityManager: EntityManager,
  ) {}

  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepo.find();
  }

  async getRestaurantByRadius(
    lat: number,
    long: number,
    radius: number, //meter
  ): Promise<DeliveryRestaurant[]> {
    //
    const EARTH_CIRCUMFERENCE_AT_EQUATOR = 40075884; //meter
    //1 degree of latitude = 111,111 meter
    const ONE_LATITUDE_DEGREE_DISTANCE = 111111; //meter
    //1 degree of longitude = cosine (latitude in radians) * length of degree at equator
    const ONE_LONGITUDE_DEGREE_DISTANCE =
      Math.cos((lat * Math.PI) / 180) * (EARTH_CIRCUMFERENCE_AT_EQUATOR / 360); //meter

    const search_area = {
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
    const restaurantsByRadius: DeliveryRestaurant[] = [];
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

  async getDeliveryRestaurantById(
    id: number,
    lat: number,
    long: number,
  ): Promise<DeliveryRestaurant> {
    const restaurant = await this.restaurantRepo.findOne({
      where: { restaurant_id: id },
    });
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
    return {
      ...restaurant,
      menu_items: restaurant.menu_items,
      distance_km: timeAnhDistance.distance_km,
      delivery_time_s: timeAnhDistance.duration_s,
    };
  }

  async getDeliveryRestaurantByListOfId(
    ids: number[],
    lat: number,
    long: number,
  ): Promise<DeliveryRestaurant[]> {
    const restaurants = await this.restaurantRepo.find({
      where: {
        restaurant_id: In(ids),
      },
    });
    const deliveryRestaurants: DeliveryRestaurant[] = [];
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
      deliveryRestaurants.push({
        ...restaurant,
        menu_items: restaurant.menu_items,
        distance_km: timeAnhDistance.distance_km,
        delivery_time_s: timeAnhDistance.duration_s,
      });
    }
    return deliveryRestaurants;
  }

  async convertIntoRestaurantDTO(
    restaurant: DeliveryRestaurant,
    priceRange: PriceRange,
  ): Promise<RestaurantDTO> {
    const restaurantDTO = new RestaurantDTO();
    const menuItems = await restaurant.menu_items;
    let having_vegeterian_food: boolean = false;
    const menuItemIds: number[] = [];
    for (const menuItem of menuItems) {
      if (menuItem.is_vegetarian === 1) {
        having_vegeterian_food = true;
      }
      menuItemIds.push(menuItem.menu_item_id);
    }

    const name: TextByLang[] = [];
    const specialty: TextByLang[] = [];
    restaurant.restaurant_ext.forEach((ext) => {
      name.push({ ISO_language_code: ext.ISO_language_code, text: ext.name });
      specialty.push({
        ISO_language_code: ext.ISO_language_code,
        text: ext.specialty,
      });
    });

    restaurantDTO.id = restaurant.restaurant_id;
    restaurantDTO.intro_video = restaurant.intro_video_obj.url;
    restaurantDTO.logo_img = restaurant.logo.url;
    restaurantDTO.name = name;
    restaurantDTO.rating = restaurant.rating;
    restaurantDTO.distance_km = restaurant.distance_km;
    restaurantDTO.delivery_time_s = restaurant.delivery_time_s;
    restaurantDTO.specialty = specialty;
    restaurantDTO.top_food = restaurant.top_food;
    restaurantDTO.promotion = restaurant.promotion;
    restaurantDTO.cutoff_time = menuItems.map((item) => item.cutoff_time);
    restaurantDTO.having_vegeterian_food = having_vegeterian_food;
    restaurantDTO.max_price = priceRange.max;
    restaurantDTO.min_price = priceRange.min;
    restaurantDTO.unit = restaurant.unit_obj.symbol;

    return restaurantDTO;
  }
}
