import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/entity/restaurant.entity';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { DeliveryRestaurant, PriceRange, TextByLang } from 'src/type';
import { Between, EntityManager, In, Repository } from 'typeorm';
import { RestaurantDTO } from '../../dto/restaurant.dto';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { RestaurantDetailDTO } from 'src/dto/restaurant-detail.dto';
import { Media } from 'src/entity/media.entity';
import { CommonService } from '../common/common.service';
import { RestaurantExt } from 'src/entity/restaurant-ext.entity';
import { FoodDTO } from 'src/dto/food.dto';
import { TRUE } from 'src/constant';
import { Contact } from 'src/entity/contact.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectRepository(Restaurant)
    private restaurantRepo: Repository<Restaurant>,
    private readonly ahamoveService: AhamoveService,
    @InjectEntityManager() private entityManager: EntityManager,
    private readonly commonService: CommonService,
  ) {}

  async findAll(): Promise<Restaurant[]> {
    return await this.restaurantRepo.find();
  } // end of findAll

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
          lat: Number(restaurant.address.latitude),
          long: Number(restaurant.address.longitude),
        },
        {
          lat: lat,
          long: long,
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
  } // end of getRestaurantByRadius

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
        lat: Number(restaurant.address.latitude),
        long: Number(restaurant.address.longitude),
      },
      {
        lat: lat,
        long: long,
      },
    );
    return {
      ...restaurant,
      menu_items: restaurant.menu_items,
      distance_km: timeAnhDistance.distance_km,
      delivery_time_s: timeAnhDistance.duration_s,
    };
  } // getDeliveryRestaurantById

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
      //remove the restaurant which having no menu item
      const menuItems = await restaurant.menu_items;
      if (menuItems.length <= 0) {
        continue;
      }

      const timeAnhDistance = await this.ahamoveService.estimateTimeAndDistance(
        {
          lat: Number(restaurant.address.latitude),
          long: Number(restaurant.address.longitude),
        },
        {
          lat: lat,
          long: long,
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
  } // getDeliveryRestaurantByListOfId

  async convertIntoRestaurantDTO(
    restaurant: DeliveryRestaurant,
    priceRange: PriceRange = { max: null, min: null },
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
    restaurantDTO.having_vegeterian_food = having_vegeterian_food;
    restaurantDTO.max_price = priceRange.max;
    restaurantDTO.min_price = priceRange.min;
    restaurantDTO.unit = restaurant.unit_obj.symbol;
    restaurantDTO.is_advanced_customizable =
      await this.commonService.checkIfRestaurantHasAdvancedCustomizableFood(
        restaurant.restaurant_id,
      );

    return restaurantDTO;
  } // convertIntoRestaurantDTO

  async getRestaurantDetailsFromEndPoint(
    restaurant_id: number,
    lat: number,
    long: number,
  ): Promise<RestaurantDetailDTO> {
    const restaurant = await this.entityManager
      .createQueryBuilder(Restaurant, 'restaurant')
      .leftJoinAndSelect('restaurant.restaurant_ext', 'extension')
      .leftJoinAndSelect('restaurant.logo', 'logo')
      .leftJoinAndSelect('restaurant.unit_obj', 'unit')
      .leftJoinAndSelect('restaurant.address', 'address')
      .leftJoinAndSelect('restaurant.menu_items', 'menuItem')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .leftJoinAndSelect('menuItem.image_obj', 'image')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .leftJoinAndSelect('menuItem.attribute_obj', 'attribute')
      .where('restaurant.restaurant_id = :restaurant_id', { restaurant_id })
      .andWhere('restaurant.is_active = 1')
      .andWhere('sku.is_standard = :standard', {
        standard: TRUE,
      })
      .andWhere('sku.is_active = :active', { active: TRUE })
      .getOne();

    if (!restaurant) {
      throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
    }

    //Get medias
    const medias = await this.getAllMediaByRestaurantId(restaurant_id);

    //Convert Restaurant Extension to TextByLang format
    const restaurant_ext = await this.convertRestaurantExtToTextByLang(
      restaurant.restaurant_ext,
    );

    //Get reviews
    const reviews = await this.commonService.getReviewsByRestaurantId(
      restaurant_id,
      5,
      'DESC',
    );

    //Get menu
    const menuItems = await restaurant.menu_items;
    const convertedMenuItems: FoodDTO[] = [];
    let having_vegeterian_food: boolean = false;
    let isAdvancedCustomizable: boolean = false;
    const cutoff_time_m = restaurant.cutoff_time_m;
    for (const menuItem of menuItems) {
      //Check if having vegeterian food
      if (menuItem.is_vegetarian === 1) {
        having_vegeterian_food = true;
      }

      //check if having advanced customization
      if (isAdvancedCustomizable == false && !!menuItem.attribute_obj) {
        if (
          menuItem.attribute_obj.filter((i) => i.type_id == 'taste').length > 0
        ) {
          isAdvancedCustomizable = true;
        }
      }

      // //push cutoff time
      // cutoff_time.push(menuItem.cutoff_time);

      //Convert to FoodDTO
      const foodDTO = await this.commonService.convertIntoFoodDTO(menuItem);
      convertedMenuItems.push(foodDTO);
    }
    // cutoff_time.sort();

    //Calculate distance and time delivery
    const timeAnhDistance = await this.ahamoveService.estimateTimeAndDistance(
      {
        lat: Number(restaurant.address.latitude),
        long: Number(restaurant.address.longitude),
      },
      {
        lat: lat,
        long: long,
      },
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
      reviews: reviews,
      name: restaurant_ext.name,
      specialty: restaurant_ext.specialty,
      introduction: restaurant_ext.introduction,
      review_total_count: restaurant.review_total_count,
      cutoff_time_m: cutoff_time_m,
      having_vegeterian_food: having_vegeterian_food,
      unit: restaurant.unit_obj.symbol,
      menu: convertedMenuItems,
      distance_km: timeAnhDistance.distance_km,
      delivery_time_s: timeAnhDistance.duration_s,
      is_advanced_customizable: isAdvancedCustomizable,
    };

    return data;
  } // getRestaurantDetailsFromEndPoint

  async convertRestaurantExtToTextByLang(
    restaurant_ext: RestaurantExt[],
  ): Promise<any> {
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
  } // convertRestaurantExtToTextByLang

  async getAllMediaByRestaurantId(restaurant_id: number): Promise<Media[]> {
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
  } // getAllMediaByRestaurantId

  async sendContactFormFromEndPoint(
    email: string,
    message: string,
  ): Promise<number> {
    const result = await this.entityManager
      .createQueryBuilder()
      .insert()
      .into(Contact)
      .values({
        email: email,
        content: message,
      })
      .execute();

    return result.identifiers[0]?.contact_id || null;
  } // end of sendContactFormFromEndPoint
}
