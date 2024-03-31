import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { Review } from 'src/type';
import { OrderService } from '../order/order.service';
import { FoodService } from '../food/food.service';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Driver } from 'src/entity/driver.entity';
import { EntityManager, Repository, getConnection, getManager } from 'typeorm';
import { FoodRating } from 'src/entity/food-rating.entity';
import { Media } from 'src/entity/media.entity';
import { DriverRating } from 'src/entity/driver-rating.entity';
import { OrderSKU } from 'src/entity/order-sku.entity';
import { OrderStatusLog } from 'src/entity/order-status-log.entity';
import { DriverStatusLog } from 'src/entity/driver-status-log.entity';
import { OrderStatus } from 'src/enum';
import { SKU } from 'src/entity/sku.entity';
import { GetReviewFormResponse } from './dto/get-review-form.dto';

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
    try {
      const currentOrder = await this.orderService.getOrderDetail(order_id);
      if (!currentOrder) {
        throw new BadRequestException('order is not found');
      }

      const orderSKU = await this.orderSKURepo.find({
        where: { order_id: order_id },
      });
      if (orderSKU && orderSKU.length == 0) {
        throw new BadRequestException('No item to reivew');
      }
      const order_items_skus = orderSKU.map((item) => item.order_sku_id);

      const queryBuilder = this.entityManager
        .getRepository(FoodRating)
        .createQueryBuilder('foodRating')
        .where(
          'foodRating.order_sku_obj.order_sku_id IN (:...ids) and foodRating.customer_id = :customer_id',
          {
            ids: order_items_skus,
            customer_id,
          },
        );

      const result = await queryBuilder.getMany();

      if (result.length > 0) {
        throw new BadRequestException('The order has been reviewed before');
      }

      const orderStatusLog = await this.orderStatusLogRepo.find({
        where: { order_id: order_id, order_status_id: OrderStatus.NEW },
      });
      const driverStatusLog = await this.driverStatusLogRepo.find({
        where: { order_id: order_id },
      });
      const skus = await this.entityManager
        .createQueryBuilder(SKU, 'sku')
        .leftJoinAndSelect('sku.menu_item', 'menuItem')
        .leftJoinAndSelect('menuItem.menuItemExt', 'menuItemExt')
        .where('sku.sku_id IN (:...skuIds)', { skuIds: order_items_skus })
        .getMany();

      const orderItems = [];
      orderSKU.forEach((i) => {
        const sku = skus.find(
          (skuWIthMenuItem) => skuWIthMenuItem.sku_id == i.sku_id,
        );
        const name = sku?.menu_item.menuItemExt;
        orderItems.push({
          _id: i.sku_id.toString(),
          num: i.qty_ordered,
          name,
          price: i.price,
          advanced_taste_customization: i.advanced_taste_customization,
          basic_taste_customization: i.basic_taste_customization,
          portion_customization: i.portion_customization,
        });
      });
      return {
        customer_id: data.customer_id,
        order_id: data.order_id,
        order_date: orderSKU[0]?.created_at?.getTime(),
        driver_id: driverStatusLog[0]?.driver_id,
        order_items: orderItems,
      };
    } catch (error) {}
  }

  async createReview(reviewDto: PostReviewRequest) {
    const currentOrder = await this.orderService.getOrderDetail(
      reviewDto.order_id,
    );
    if (!currentOrder) {
      throw new BadRequestException('order is not found');
    }

    if (!currentOrder.driver) {
      throw new BadRequestException('driver is not found');
    }
    let is_valid_sku = false;
    const sku_ids = reviewDto?.food_reviews.map((x) => x.order_sku_id);
    if (!currentOrder?.order_items || currentOrder?.order_items.length === 0) {
      is_valid_sku = true;
    }
    const order_items_skus = currentOrder?.order_items.map((x) => x.sku_id);
    is_valid_sku =
      sku_ids.length <= order_items_skus.length &&
      order_items_skus.every((x) => sku_ids.includes(x));
    if (!is_valid_sku) {
      throw new BadRequestException('Some of the order item is not found');
    }
    const isOrderViewed = await this.isOrderViewed(
      order_items_skus,
      reviewDto.customer_id,
    );
    if (isOrderViewed) {
      throw new BadRequestException('The order has been reviewed before');
    }

    // insert
    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          const driver_reviewed = new DriverRating();
          driver_reviewed.driver_id = reviewDto.driver_review.driver_id;
          driver_reviewed.order_id = reviewDto.order_id;
          driver_reviewed.score = reviewDto.driver_review.score;
          driver_reviewed.remarks = reviewDto.driver_review.remarks;
          driver_reviewed.customer_id = reviewDto.customer_id;
          await transactionalEntityManager.save(driver_reviewed);
          for (const img_url of reviewDto.driver_review.img_urls) {
            const driverMedia = new Media();
            driverMedia.driver_rating_id = driver_reviewed.driver_rating_id;
            driverMedia.type = 'image';
            driverMedia.name = 'drive_review';
            driverMedia.url = img_url;
            await transactionalEntityManager.save(driverMedia);
          }
          for (const food_review of reviewDto.food_reviews) {
            const food_rating = new FoodRating();
            food_rating.order_sku_id = food_review.order_sku_id;
            food_rating.remarks = food_review.remarks;
            food_rating.score = food_review.score;
            food_rating.customer_id = reviewDto.customer_id;

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
      throw new InternalServerErrorException();
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
