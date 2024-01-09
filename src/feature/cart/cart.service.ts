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
      const advanced_taste_customization_obj_txt = JSON.stringify(
        advanced_taste_customization_obj,
      );
      const basic_taste_customization_obj_txt = JSON.stringify(
        basic_taste_customization_obj,
      );

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
      const currentCart = await this.getCart(customer_id);

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
      if (currentCart.length === 0) {
        await this.insertCart(
          customer_id,
          sku_id,
          qty_ordered,
          advanced_taste_customization,
          basic_taste_customization,
          portion_customization,
          advanced_taste_customization_obj_txt,
          basic_taste_customization_obj_txt,
          notes,
          sku.menu_item.restaurant_id,
        );
        return await this.getCart(customer_id);
      }

      // Check if the sku_id’s restaurant is the same as the current cart’s items
      if (sku.menu_item.restaurant_id != currentCart[0].restaurant_id) {
        //Only compare to the first item of the cart. Assume that all of the items
        //of the cart have the same restaurant_id
        throw new HttpException(
          `Added item should have the same restaurant_id as the current cart`,
          400,
        );
      }

      //Get the item which having the same sku_id
      const similarCartItem = currentCart.find((i) => i.sku_id == sku_id);
      if (!similarCartItem) {
        //There is no item which having the same sku_id in the cart
        await this.insertCart(
          customer_id,
          sku_id,
          qty_ordered,
          advanced_taste_customization,
          basic_taste_customization,
          portion_customization,
          advanced_taste_customization_obj_txt,
          basic_taste_customization_obj_txt,
          notes,
          sku.menu_item.restaurant_id,
        );
        return await this.getCart(customer_id);
      }

      //check if the similar item has the same advanced_taste_customization_obj
      //and basic_taste_customization_obj
      const isSameCustomization =
        advanced_taste_customization_obj_txt ==
          similarCartItem.advanced_taste_customization_obj &&
        basic_taste_customization_obj_txt ==
          similarCartItem.basic_taste_customization_obj;
      if (isSameCustomization) {
        await this.updateCart(
          similarCartItem.item_id,
          similarCartItem.customer_id,
          similarCartItem.sku_id,
          similarCartItem.qty_ordered + qty_ordered,
          similarCartItem.advanced_taste_customization,
          similarCartItem.basic_taste_customization,
          similarCartItem.portion_customization,
          similarCartItem.advanced_taste_customization_obj,
          similarCartItem.basic_taste_customization_obj,
          similarCartItem.notes,
          similarCartItem.restaurant_id,
        );
        return await this.getCart(customer_id);
      }

      await this.insertCart(
        customer_id,
        sku_id,
        qty_ordered,
        advanced_taste_customization,
        basic_taste_customization,
        portion_customization,
        advanced_taste_customization_obj_txt,
        basic_taste_customization_obj_txt,
        notes,
        sku.menu_item.restaurant_id,
      );
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

  async insertCart(
    customer_id: number,
    sku_id: number,
    qty_ordered: number,
    advanced_taste_customization: string,
    basic_taste_customization: string,
    portion_customization: string,
    advanced_taste_customization_obj: string,
    basic_taste_customization_obj: string,
    notes: string,
    restaurant_id: number,
  ): Promise<void> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
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
          advanced_taste_customization_obj: advanced_taste_customization_obj,
          basic_taste_customization_obj: basic_taste_customization_obj,
          notes: notes,
          restaurant_id: restaurant_id,
        })
        .execute();
    }
  }

  async updateCart(
    item_id: number,
    customer_id: number,
    sku_id: number,
    qty_ordered: number,
    advanced_taste_customization: string,
    basic_taste_customization: string,
    portion_customization: string,
    advanced_taste_customization_obj: string,
    basic_taste_customization_obj: string,
    notes: string,
    restaurant_id: number,
  ): Promise<void> {
    if (this.flagService.isFeatureEnabled('fes-24-add-to-cart')) {
      await this.entityManager
        .createQueryBuilder()
        .update(CartItem)
        .set({
          customer_id: customer_id,
          sku_id: sku_id,
          qty_ordered: qty_ordered,
          advanced_taste_customization: advanced_taste_customization,
          basic_taste_customization: basic_taste_customization,
          portion_customization: portion_customization,
          advanced_taste_customization_obj: advanced_taste_customization_obj,
          basic_taste_customization_obj: basic_taste_customization_obj,
          notes: notes,
          restaurant_id: restaurant_id,
        })
        .where('item_id = :item_id', { item_id })
        .execute();
    }
  }
}
