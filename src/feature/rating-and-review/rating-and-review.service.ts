import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { Review, TextByLang } from 'src/type';
import { OrderService } from '../order/order.service';
import { FoodService } from '../food/food.service';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Driver } from 'src/entity/driver.entity';
import { EntityManager, Repository } from 'typeorm';
import { FoodRating } from 'src/entity/food-rating.entity';
import { Media } from 'src/entity/media.entity';
import { DriverRating } from 'src/entity/driver-rating.entity';
import { OrderSKU } from 'src/entity/order-sku.entity';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { OrderStatus } from 'src/enum';
import { GetReviewFormRequest } from './dto/get-review-form-request.dto';
import {
  GetReviewFormResponse,
  OrderItem as GetReviewFormOrderItem,
} from './dto/get-review-form-response.dto';
import { CustomRpcException } from 'src/exceptions/custom-rpc.exception';
import { Order } from 'src/entity/order.entity';

@Injectable()
export class RatingAndReviewService {
  private readonly logger = new Logger(RatingAndReviewService.name);
  constructor(
    private readonly orderService: OrderService,
    private readonly foodService: FoodService,
    @InjectRepository(Driver)
    private driverRepo: Repository<Driver>,
    @InjectRepository(DriverRating)
    private driverRatingRepo: Repository<DriverRating>,
    @InjectRepository(FoodRating)
    private foodRatingRepo: Repository<FoodRating>,
    @InjectRepository(OrderSKU)
    private orderSKURepo: Repository<OrderSKU>,
    @InjectEntityManager() private entityManager: EntityManager,
    @InjectRepository(OrderStatusLog)
    private orderStatusLogRepo: Repository<OrderStatusLog>,
    @InjectRepository(DriverStatusLog)
    private driverStatusLogRepo: Repository<DriverStatusLog>,
  ) {}
  async getTopReviewFromEndPoint(): Promise<Review[]> {
    const reviews: Review[] = [];
    const filePath = 'src/fake_data/top-reviews.json';
    const fileContent = readFileSync(filePath, 'utf-8');
    const data: Review[] = JSON.parse(fileContent);
    reviews.push(...data);
    return reviews;
  }

  async getReviewForm(
    data: GetReviewFormRequest,
  ): Promise<GetReviewFormResponse> {
    const order_id = data.order_id;
    const customer_id = data.customer_id;
    // try {
    // const currentOrder = await this.orderService.getOrderDetail(order_id);
    const currentOrder = await this.entityManager
      .createQueryBuilder(Order, 'order')
      .where('order.order_id = :order_id', { order_id })
      .andWhere('order.customer_id = :customer_id', { customer_id })
      .getOne();
    if (!currentOrder) {
      // throw new BadRequestException('order is not found');
      throw new CustomRpcException(3, 'Order is not found');
    }
    const latestOrderStatus =
      await this.orderService.getLatestOrderStatus(order_id);
    if (
      !latestOrderStatus ||
      latestOrderStatus.order_status_id !== OrderStatus.COMPLETED
    ) {
      throw new CustomRpcException(5, 'Order is not completed');
    }

    // const orderSKU = await this.orderSKURepo.find({
    //   where: { order_id: order_id },
    // });
    const orderSKU = await this.entityManager
      .createQueryBuilder(OrderSKU, 'orderSKU')
      .leftJoinAndSelect('orderSKU.sku_obj', 'sku')
      .leftJoinAndSelect('sku.menu_item', 'menuItem')
      .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .where('orderSKU.order_id = :order_id', { order_id })
      .getMany();
    if (orderSKU && orderSKU.length == 0) {
      // throw new BadRequestException('No item to reivew');
      throw new CustomRpcException(9, 'Something wrong with order data');
    }

    // START - Check if the order has been reviewed before
    const order_items_skus = orderSKU.map((item) => item.order_sku_id);

    // const queryBuilder = this.entityManager
    //   .getRepository(FoodRating)
    //   .createQueryBuilder('foodRating')
    //   .where(
    //     'foodRating.order_sku_obj.order_sku_id IN (:...ids) and foodRating.customer_id = :customer_id',
    //     {
    //       ids: order_items_skus,
    //       customer_id,
    //     },
    //   );

    // const result = await queryBuilder.getMany();

    // if (result.length > 0) {
    //   throw new CustomRpcException(4, 'The order has been reviewed before');
    //   // throw new BadRequestException('The order has been reviewed before');
    // }

    const isOrderViewed = await this.isOrderViewed(
      order_items_skus,
      customer_id,
    );
    if (isOrderViewed) {
      throw new CustomRpcException(4, 'The order has been reviewed before');
    }
    // END - Check if the order has been reviewed before

    const orderStatusLog = await this.orderStatusLogRepo.find({
      where: { order_id: order_id, order_status_id: OrderStatus.NEW },
    });

    // const driverStatusLog = await this.driverStatusLogRepo.find({
    //   where: { order_id: order_id },
    // });
    //Get driver info
    const driverStatusLog = await this.entityManager
      .createQueryBuilder(DriverStatusLog, 'driverLog')
      .where('driverLog.order_id = :order_id', { order_id })
      .orderBy('driverLog.logged_at', 'DESC')
      .getOne();
    if (!driverStatusLog || !driverStatusLog.driver_id) {
      throw new CustomRpcException(9, 'Something wrong with order data');
    }

    // const skus = await this.entityManager
    //   .createQueryBuilder(SKU, 'sku')
    //   .leftJoinAndSelect('sku.menu_item', 'menuItem')
    //   .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
    //   .where('sku.sku_id IN (:...skuIds)', { skuIds: order_items_skus })
    //   .getMany();

    const orderItems: GetReviewFormOrderItem[] = [];
    orderSKU.forEach((i) => {
      // const sku = skus.find(
      //   (skuWIthMenuItem) => skuWIthMenuItem.sku_id == i.sku_id,
      // );
      const name: TextByLang[] = i.sku_obj.menu_item.menuItemExt.map((i) => {
        return {
          ISO_language_code: i.ISO_language_code,
          text: i.name,
        };
      });
      orderItems.push({
        // _id: i.sku_id.toString(),
        // num: i.qty_ordered,
        // name,
        order_sku_id: i.order_sku_id,
        name: name,
        price: i.price,
        advanced_taste_customization: i.advanced_taste_customization,
        basic_taste_customization: i.basic_taste_customization,
        portion_customization: i.portion_customization,
      });
    });

    const res: GetReviewFormResponse = {
      customer_id: data.customer_id,
      order_id: data.order_id,
      // order_date: orderSKU[0]?.created_at?.getTime(),
      order_date: orderStatusLog[0]?.logged_at,
      driver_id: driverStatusLog.driver_id,
      order_items: orderItems,
    };
    return res;
    // } catch (error) {}
  }

  async createReview(reviewDto: PostReviewRequest) {
    const { order_id, customer_id, driver_review, food_reviews } = reviewDto;

    //validate order_id valid
    const currentOrder = await this.entityManager
      .createQueryBuilder(Order, 'order')
      .where('order.order_id = :order_id', { order_id })
      .andWhere('order.customer_id = :customer_id', { customer_id })
      .getOne();
    if (!currentOrder) {
      throw new CustomRpcException(3, 'Order is not found');
    }

    const latestOrderStatus =
      await this.orderService.getLatestOrderStatus(order_id);

    if (
      !latestOrderStatus ||
      latestOrderStatus.order_status_id !== OrderStatus.COMPLETED
    ) {
      throw new CustomRpcException(7, 'Order is not completed');
    }

    // validate driver_id valid
    const driverStatusLog = await this.entityManager
      .createQueryBuilder(DriverStatusLog, 'driverLog')
      .where('driverLog.order_id = :order_id', { order_id })
      .orderBy('driverLog.logged_at', 'DESC')
      .getOne();
    if (
      !driverStatusLog ||
      !driverStatusLog.driver_id ||
      driverStatusLog.driver_id != driver_review.driver_id
    ) {
      throw new CustomRpcException(4, 'Driver data is not found');
    }

    //get order items
    const orderSKU = await this.entityManager
      .createQueryBuilder(OrderSKU, 'orderSKU')
      // .leftJoinAndSelect('orderSKU.sku_obj', 'sku')
      // .leftJoinAndSelect('sku.menu_item', 'menuItem')
      // .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
      .where('orderSKU.order_id = :order_id', { order_id })
      .getMany();
    if (orderSKU && orderSKU.length == 0) {
      // throw new BadRequestException('No item to reivew');
      throw new CustomRpcException(9, 'Something wrong with order data');
    }

    const order_items_skus = orderSKU.map((item) => item.order_sku_id);

    // validate order_sku_id list
    const is_valid_order_sku_list = food_reviews.every((i) =>
      order_items_skus.includes(i.order_sku_id),
    );
    if (!is_valid_order_sku_list) {
      throw new CustomRpcException(5, 'Some of food item is not found');
    }

    // let is_valid_sku = false;
    // const review_order_sku_ids = reviewDto.food_reviews.map(
    //   (x) => x.order_sku_id,
    // );
    // if (!currentOrder.order_items || currentOrder.order_items.length === 0) {
    //   // is_valid_sku = true;
    //   throw new CustomRpcException(9, 'Something wrong with order data');
    // }
    // const order_sku_ids = currentOrder.order_items.map((x) => x.sku_id);
    // is_valid_sku =
    //   sku_ids.length <= order_items_skus.length &&
    //   order_items_skus.every((x) => sku_ids.includes(x));
    // if (!is_valid_sku) {
    //   // throw new BadRequestException('Some of the order item is not found');
    //   throw new CustomRpcException(4, 'Driver is not found');
    // }

    // check if the order has been reviewed before
    const isOrderViewed = await this.isOrderViewed(
      order_items_skus,
      reviewDto.customer_id,
    );
    if (isOrderViewed) {
      // throw new BadRequestException('The order has been reviewed before');
      throw new CustomRpcException(6, 'The order has been reviewed before');
    }

    // insert db
    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const driver_reviewed = new DriverRating();
          driver_reviewed.driver_id = driver_review.driver_id;
          driver_reviewed.order_id = order_id;
          driver_reviewed.score = driver_review.score;
          driver_reviewed.remarks = driver_review.remarks;
          driver_reviewed.customer_id = customer_id;
          await transactionalEntityManager.save(driver_reviewed);
          for (const img_url of driver_review.img_urls) {
            const driverMedia = new Media();
            driverMedia.driver_rating_id = driver_reviewed.driver_rating_id;
            driverMedia.type = 'image';
            driverMedia.name = 'drive_review';
            driverMedia.url = img_url;
            await transactionalEntityManager.save(driverMedia);
          }
          for (const food_review of food_reviews) {
            const food_rating = new FoodRating();
            food_rating.order_sku_id = food_review.order_sku_id;
            food_rating.remarks = food_review.remarks;
            food_rating.score = food_review.score;
            food_rating.customer_id = customer_id;

            await transactionalEntityManager.save(food_rating);

            for (const img_url of food_review.img_urls) {
              const driverMedia = new Media();
              driverMedia.food_rating_id = food_rating.food_rating_id;
              driverMedia.type = 'image';
              driverMedia.name = 'food_review';
              driverMedia.url = img_url;
              await transactionalEntityManager.save(driverMedia);
            }
          }
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new CustomRpcException(
        99,
        'Fail to insert into the database. Try again!',
      );
    }
  }

  private async isOrderViewed(skus, customer_id): Promise<boolean> {
    const queryBuilder = this.entityManager
      .getRepository(FoodRating)
      .createQueryBuilder('foodRating')
      .where(
        'foodRating.order_sku_obj.order_sku_id IN (:...ids) and foodRating.customer_id = :customer_id',
        {
          ids: skus,
          customer_id,
        },
      );

    const result = await queryBuilder.getMany();

    return result.length > 0;
  }
}
