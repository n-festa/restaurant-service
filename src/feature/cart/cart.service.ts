import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { CartItem } from 'src/entity/cart-item.entity';
import { CommonService } from '../common/common.service';
import { SKU } from 'src/entity/sku.entity';
import {
  BasicTasteSelection,
  OptionSelection,
  UpdatedCartItem,
} from 'src/type';

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

      // Check if the adding item does exist
      const existingItem = currentCart.find(
        (i) =>
          i.sku_id == sku_id &&
          i.advanced_taste_customization_obj ==
            advanced_taste_customization_obj_txt &&
          i.basic_taste_customization_obj == basic_taste_customization_obj_txt,
      );
      if (existingItem) {
        //The item does exist => increase the quantity
        await this.updateCart(
          existingItem.item_id,
          existingItem.customer_id,
          existingItem.sku_id,
          existingItem.qty_ordered + qty_ordered,
          existingItem.advanced_taste_customization,
          existingItem.basic_taste_customization,
          existingItem.portion_customization,
          existingItem.advanced_taste_customization_obj,
          existingItem.basic_taste_customization_obj,
          existingItem.notes,
          existingItem.restaurant_id,
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

  async updateCartFromEndPoint(
    customer_id: number,
    updated_cart_items: UpdatedCartItem[],
    lang: string,
  ): Promise<CartItem[]> {
    if (this.flagService.isFeatureEnabled('fes-28-update-cart')) {
      // Get the corresponding cart items in DB
      const mentionedCartItems = await this.getCartByItemId(
        updated_cart_items.map((i) => i.item_id),
        customer_id,
      );
      if (mentionedCartItems.length < updated_cart_items.length) {
        throw new HttpException(
          'There are some of updated items which do not belong to the customer',
          400,
        );
      }

      //BUILD UPDATE DATA
      const fullSelectedUpdatedItems: CartItem[] = [];
      for (const mentionedCartItem of mentionedCartItems) {
        const updatedCartItem = updated_cart_items.find(
          (i) => i.item_id === mentionedCartItem.item_id,
        );

        const advanced_taste_customization_obj_txt = JSON.stringify(
          updatedCartItem.advanced_taste_customization_obj,
        );
        const basic_taste_customization_obj_txt = JSON.stringify(
          updatedCartItem.basic_taste_customization_obj,
        );

        //Check if the SKU does exist
        const sku = await this.entityManager
          .createQueryBuilder(SKU, 'sku')
          .leftJoinAndSelect('sku.menu_item', 'menuItem')
          .where('sku.sku_id = :sku_id', { sku_id: updatedCartItem.sku_id })
          .getOne();
        if (!sku) {
          throw new HttpException('SKU does not exist', 404);
        }

        //Remove the unchange cart item
        if (
          updatedCartItem.sku_id == mentionedCartItem.sku_id &&
          updatedCartItem.qty_ordered == mentionedCartItem.qty_ordered &&
          advanced_taste_customization_obj_txt ==
            mentionedCartItem.advanced_taste_customization_obj &&
          basic_taste_customization_obj_txt ==
            mentionedCartItem.basic_taste_customization_obj &&
          updatedCartItem.notes == mentionedCartItem.notes
        ) {
          continue;
        }

        let advanced_taste_customization: string = '';
        let basic_taste_customization: string = '';
        let portion_customization: string = '';

        if (updatedCartItem.sku_id != mentionedCartItem.sku_id) {
          // --- DIFFERENT SKU ---

          //Check if a new SKU belongs to the current Menu Item of the current Cart Item
          const isAllowedSku =
            await this.commonService.checkIfSkuHasSameMenuItem([
              updatedCartItem.sku_id,
              mentionedCartItem.sku_id,
            ]);

          if (!isAllowedSku) {
            throw new HttpException(
              `Updated sku_id ${updatedCartItem.sku_id} does not have the same Menu Item as the current mentioning sku_id`,
              400,
            );
          }

          //Interpret Portion Customization
          portion_customization =
            await this.commonService.interpretPortionCustomization(
              updatedCartItem.sku_id,
              lang,
            );
        } else if (updatedCartItem.sku_id == mentionedCartItem.sku_id) {
          //---- SAME SKU ----
          portion_customization = mentionedCartItem.portion_customization;
        }

        //---- COMPARE ADVANCE TASTE CUSTOMIZATION ----
        if (
          advanced_taste_customization_obj_txt !=
          mentionedCartItem.advanced_taste_customization_obj
        ) {
          // --- Different advanced taste customiztion ---
          // Check if the advanced_taste_customization_obj is all available to this SKU
          const advancedTasteCustomizationValidation =
            await this.commonService.validateAdvacedTasteCustomizationObjWithMenuItem(
              updatedCartItem.advanced_taste_customization_obj,
              sku.menu_item_id,
            );
          if (!advancedTasteCustomizationValidation.isValid) {
            throw new HttpException(
              advancedTasteCustomizationValidation.message,
              400,
            );
          }
          //Interpret Advance Taste Customization
          advanced_taste_customization =
            await this.commonService.interpretAdvanceTaseCustomization(
              updatedCartItem.advanced_taste_customization_obj,
              lang,
            );
        } else if (
          advanced_taste_customization_obj_txt ==
          mentionedCartItem.advanced_taste_customization_obj
        ) {
          // --- Same advanced taste customization
          advanced_taste_customization =
            mentionedCartItem.advanced_taste_customization;
        }

        //---- COMPARE BASIC TASTE CUSTOMIZATION ----
        if (
          basic_taste_customization_obj_txt !=
          mentionedCartItem.basic_taste_customization_obj
        ) {
          // --- Different basic taste customization ---
          // Check if the basic_taste_customization_obj is all available to this SKU
          const basicTasteCustomizationValidation =
            await this.commonService.validateBasicTasteCustomizationObjWithMenuItem(
              updatedCartItem.basic_taste_customization_obj,
              sku.menu_item_id,
            );
          if (!basicTasteCustomizationValidation.isValid) {
            throw new HttpException(
              basicTasteCustomizationValidation.message,
              400,
            );
          }
          //Interpret Basic  Taste Customization
          basic_taste_customization =
            await this.commonService.interpretBasicTaseCustomization(
              updatedCartItem.basic_taste_customization_obj,
              lang,
            );
        } else if (
          basic_taste_customization_obj_txt ==
          mentionedCartItem.basic_taste_customization_obj
        ) {
          // --- Same basic taste customization ---
          basic_taste_customization =
            mentionedCartItem.basic_taste_customization;
        }

        //Mapping data
        const fullSelectedUpdatedItem: CartItem = {
          item_id: updatedCartItem.item_id,
          customer_id: customer_id,
          sku_id: updatedCartItem.sku_id,
          qty_ordered: updatedCartItem.qty_ordered,
          advanced_taste_customization: advanced_taste_customization,
          basic_taste_customization: basic_taste_customization,
          portion_customization: portion_customization,
          advanced_taste_customization_obj:
            advanced_taste_customization_obj_txt,
          basic_taste_customization_obj: basic_taste_customization_obj_txt,
          notes: updatedCartItem.notes,
          restaurant_id: mentionedCartItem.restaurant_id,
          created_at: mentionedCartItem.created_at,
        };
        fullSelectedUpdatedItems.push(fullSelectedUpdatedItem);
      }

      await this.massUpdateCartItem(fullSelectedUpdatedItems);

      return await this.getCart(customer_id);
    }
  }
  async getCartByItemId(item_ids: number[], customer_id) {
    if (this.flagService.isFeatureEnabled('fes-28-update-cart')) {
      return await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .where('cart.customer_id = :customer_id', { customer_id })
        .andWhere('cart.item_id IN (:...item_ids)', { item_ids })
        .getMany();
    }
  }

  async massUpdateCartItem(cart_items: CartItem[]): Promise<void> {
    //Only do the mass updating if the udated sku has the same as the sku of the current item
    if (this.flagService.isFeatureEnabled('fes-28-update-cart')) {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // execute queries using transactionalEntityManager
          for (const cart_item of cart_items) {
            //Check if the SKUs are different
            const sku_id = (
              await transactionalEntityManager
                .createQueryBuilder(CartItem, 'cart')
                .where('cart.item_id = :item_id', {
                  item_id: cart_item.item_id,
                })
                .select('cart.sku_id')
                .getOne()
            ).sku_id;

            if (sku_id != cart_item.sku_id) {
              throw new HttpException(
                'Only do the mass updating if the udated sku has the same as the sku of the current item',
                400,
              );
            }
            await transactionalEntityManager
              .createQueryBuilder()
              .update(CartItem)
              .set({
                customer_id: cart_item.customer_id,
                sku_id: cart_item.sku_id,
                qty_ordered: cart_item.qty_ordered,
                advanced_taste_customization:
                  cart_item.advanced_taste_customization,
                basic_taste_customization: cart_item.basic_taste_customization,
                portion_customization: cart_item.portion_customization,
                advanced_taste_customization_obj:
                  cart_item.advanced_taste_customization_obj,
                basic_taste_customization_obj:
                  cart_item.basic_taste_customization_obj,
                notes: cart_item.notes,
                restaurant_id: cart_item.restaurant_id,
                created_at: cart_item.created_at,
              })
              .where('item_id = :item_id', { item_id: cart_item.item_id })
              .execute();
          }
        },
      );
    }
  }
}
