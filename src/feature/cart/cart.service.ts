import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { AddToCartResponse } from './dto/add-to-cart-response.dto';
import { AddToCartRequest } from './dto/add-to-cart-request.dto';
import { CartItem } from 'src/entity/cart-item.entity';
import { CommonService } from '../common/common.service';

@Injectable()
export class CartService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly commonService: CommonService,
  ) {}
  async addCartItem(inputData: AddToCartRequest): Promise<AddToCartResponse> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      const res = new AddToCartResponse(200, '');

      const {
        customer_id,
        sku_id,
        qty_ordered,
        advanced_taste_customization_obj,
        basic_taste_customization_obj,
        lang: lang = 'vie', // default vie if there is no specific language
      } = inputData;

      //Get the current cart
      const cart = await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .where('cart.customer_id = :customer_id', { customer_id })
        .getMany();

      //Interpret Advance Taste Customization
      const advanced_taste_customization =
        await this.commonService.interpretAdvanceTaseCustomization(
          advanced_taste_customization_obj,
          lang,
        );
      console.log('advanced_taste_customization', advanced_taste_customization);

      //Interpret Basic  Taste Customization
      const basic_taste_customization =
        await this.commonService.interpretBasicTaseCustomization(
          basic_taste_customization_obj,
          lang,
        );
      console.log('basic_taste_customization', basic_taste_customization);

      //If cart is empty, create a new cart
      // if (cart.length === 0) {
      //   const item = await this.entityManager
      //     .createQueryBuilder()
      //     .insert()
      //     .into(CartItem)
      //     .values({
      //       customer_id: customer_id,
      //       sku_id: sku_id,
      //       qty_ordered: qty_ordered,
      //       advanced_taste_customization: '',
      //       basic_taste_customization: '',
      //       portion_customization: '',
      //       advanced_taste_customization_obj: JSON.stringify(
      //         advanced_taste_customization_obj,
      //       ),
      //       basic_taste_customization_obj: JSON.stringify(
      //         basic_taste_customization_obj,
      //       ),
      //       notes: notes,
      //       restaurant_id: null,
      //     })
      //     .execute();
      // }

      //success
      res.statusCode = 200;
      //   res.message = 'Add to cart successfully';
      res.message = cart;
      res.data = null;

      return res;
    }
  }
}
