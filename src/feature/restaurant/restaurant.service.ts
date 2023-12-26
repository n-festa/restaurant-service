import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { DeliveryRestaurant, PriceRange, TextByLang } from 'src/type';
import { Between, EntityManager, In, Repository } from 'typeorm';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { GeneralResponse } from 'src/dto/general-response.dto';
import { RestaurantDetailDTO } from 'src/dto/restaurant-detail.dto';
import { Media } from 'src/entity/media.entity';

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

  async getRestaurantDetails(restaurant_id: number) {
    if (this.flagService.isFeatureEnabled('fes-18-get-restaurant-detail')) {
      const result = new GeneralResponse(200, '');

      const restaurant = await this.entityManager
        .createQueryBuilder(Restaurant, 'restaurant')
        .leftJoinAndSelect('restaurant.restaurant_ext', 'extension')
        .leftJoinAndSelect('restaurant.logo', 'logo')
        .leftJoinAndSelect('restaurant.unit_obj', 'unit')
        .leftJoinAndSelect('restaurant.address', 'address')
        .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
        .andWhere('restaurant.is_active = 1')
        .getOne();

      //Get medias
      const medias = await this.getAllMediaByRestaurantId(restaurant_id);

      //Convert Restaurant Extension to TextByLang format
      const restaurant_ext = await this.convertRestaurantExtToTextByLang(
        restaurant.restaurant_ext,
      );

      //Mapping data with output
      const data: RestaurantDetailDTO = {
        restaurant_id: restaurant.restaurant_id,
        medias: medias.map((media) => {
          return {
            type: media.type,
            url: media.url,
          };
        }),
        address: {
          address_line: restaurant.address.address_line,
          city: restaurant.address.city,
          district: restaurant.address.district,
          ward: restaurant.address.ward,
          country: restaurant.address.country,
          latitude: restaurant.address.latitude,
          longitude: restaurant.address.longitude,
        },
        logo_img: restaurant.logo.url,
        rating: restaurant.rating,
        top_food: restaurant.top_food,
        promotion: restaurant.promotion,
        reviews: [],
        name: restaurant_ext.name,
        specialty: restaurant_ext.specialty,
        introduction: restaurant_ext.introduction,
        review_total_count: restaurant.review_total_count,
        distance_km: null,
        delivery_time_s: null,
        cutoff_time: [],
        having_vegeterian_food: null,
        max_price: null,
        min_price: null,
        unit: restaurant.unit_obj.symbol,
        menu: [],
      };

      result.statusCode = 200;
      result.message = 'Getting Restaurant Details Successfully';
      result.data = data;
      return result;
    }
    //CURRENT LOGIC
  }

  async convertRestaurantExtToTextByLang(
    restaurant_ext: RestaurantExt[],
  ): Promise<any> {
    if (this.flagService.isFeatureEnabled('fes-18-get-restaurant-detail')) {
      const result = {
        name: [],
        specialty: [],
        introduction: [],
      };
      for (const ext of restaurant_ext) {
        //name
        const nameByLang: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        };
        result.name.push(nameByLang);

        //specialty
        const specialtyByLang: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.specialty,
        };
        result.specialty.push(specialtyByLang);

        //introduction
        const introductionByLang: TextByLang = {
          ISO_language_code: ext.ISO_language_code,
          text: ext.introduction,
        };
        result.introduction.push(introductionByLang);
      }
      return result;
    }
  }

  async getAllMediaByRestaurantId(restaurant_id: number): Promise<Media[]> {
    if (this.flagService.isFeatureEnabled('fes-18-get-restaurant-detail')) {
      const data = await this.entityManager
        .createQueryBuilder(Media, 'media')
        .leftJoin(
          Restaurant,
          'restaurant',
          'restaurant.intro_video = media.media_id',
        )
        .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
        .orWhere('media.restaurant_id = :restaurant_id', { restaurant_id })
        .getMany();
      return data;
    }
  }
}
