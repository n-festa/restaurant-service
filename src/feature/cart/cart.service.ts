import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { CartItem } from 'src/entity/cart-item.entity';
import { CommonService } from '../common/common.service';
import { SKU } from 'src/entity/sku.entity';
import { BasicTasteSelection, OptionSelection } from 'src/type';

@Injectable()
export class CartService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly commonService: CommonService,
  ) {}
  async addCartItem(
    customer_id: number,
    sku_id: number,
    qty_ordered: number,
    advanced_taste_customization_obj: OptionSelection[],
    basic_taste_customization_obj: BasicTasteSelection[],
    notes: string,
    lang: string = 'vie',
  ): Promise<CartItem[]> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      //Check if the SKU does exist
      const sku = await this.entityManager
        .createQueryBuilder(SKU, 'sku')
        .leftJoinAndSelect('sku.menu_item', 'menuItem')
        .where('sku.sku_id = :sku_id', { sku_id })
        .getOne();
      if (!sku) {
        throw new HttpException('SKU does not exist', 404);
      }

      // Check if the advanced_taste_customization_obj is all available to this SKU
      const advancedTasteCustomizationValidation =
        await this.commonService.validateAdvacedTasteCustomizationObjWithMenuItem(
          advanced_taste_customization_obj,
          sku.menu_item_id,
        );
      if (!advancedTasteCustomizationValidation.isValid) {
        throw new HttpException(
          advancedTasteCustomizationValidation.message,
          400,
        );
      }

      // Check if the basic_taste_customization_obj is all available to this SKU
      const basicTasteCustomizationValidation =
        await this.commonService.validateBasicTasteCustomizationObjWithMenuItem(
          basic_taste_customization_obj,
          sku.menu_item_id,
        );
      if (!basicTasteCustomizationValidation.isValid) {
        throw new HttpException(basicTasteCustomizationValidation.message, 400);
      }

      //Get the current cart
      const cart = await this.getCart(customer_id);

      //Interpret Advance Taste Customization
      const advanced_taste_customization =
        await this.commonService.interpretAdvanceTaseCustomization(
          advanced_taste_customization_obj,
          lang,
        );

      //Interpret Basic  Taste Customization
      const basic_taste_customization =
        await this.commonService.interpretBasicTaseCustomization(
          basic_taste_customization_obj,
          lang,
        );

      //Interpret Portion Customization
      const portion_customization =
        await this.commonService.interpretPortionCustomization(sku_id, lang);

      //If cart is empty, create a new cart
      if (cart.length === 0) {
        await this.entityManager
          .createQueryBuilder()
          .insert()
          .into(CartItem)
          .values({
            customer_id: customer_id,
            sku_id: sku_id,
            qty_ordered: qty_ordered,
            advanced_taste_customization: advanced_taste_customization,
            basic_taste_customization: basic_taste_customization,
            portion_customization: portion_customization,
            advanced_taste_customization_obj: JSON.stringify(
              advanced_taste_customization_obj,
            ),
            basic_taste_customization_obj: JSON.stringify(
              basic_taste_customization_obj,
            ),
            notes: notes,
            restaurant_id: sku.menu_item.restaurant_id,
          })
          .execute();
      }

      return await this.getCart(customer_id);
    }
  }

  async getCart(customer_id: number): Promise<CartItem[]> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      return await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .where('cart.customer_id = :customer_id', { customer_id })
        .getMany();
    }
  }
}
