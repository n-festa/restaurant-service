import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { CartItem } from 'src/entity/cart-item.entity';
import { CommonService } from '../common/common.service';
import { SKU } from 'src/entity/sku.entity';
import {
  BasicTasteSelection,
  CartPackagingInfo,
  DayShift,
  FullCartItem,
  OptionSelection,
  QuantityUpdatedItem,
  ThisDate,
  TimeRange,
  TimeSlot,
} from 'src/type';
import { DAY_ID, DAY_NAME } from 'src/constant';
import { Shift } from 'src/enum';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';
import { MenuItemPackaging } from 'src/entity/menuitem-packaging.entity';
import { MenuItem } from 'src/entity/menu-item.entity';

@Injectable()
export class CartService {
  constructor(
    @Inject('FLAGSMITH_SERVICE') private readonly flagService: FlagsmithService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly commonService: CommonService,
    private readonly ahamoveService: AhamoveService,
  ) {}
  async addCartItem(
    customer_id: number,
    sku_id: number,
    qty_ordered: number = 1,
    advanced_taste_customization_obj: OptionSelection[] = [],
    basic_taste_customization_obj: BasicTasteSelection[] = [],
    notes: string = '',
    packaging_id: number = null,
    lang: string = 'vie',
  ): Promise<FullCartItem[]> {
    const advanced_taste_customization_obj_txt =
      advanced_taste_customization_obj.length > 0
        ? JSON.stringify(advanced_taste_customization_obj)
        : '';
    const basic_taste_customization_obj_txt =
      basic_taste_customization_obj.length > 0
        ? JSON.stringify(basic_taste_customization_obj)
        : '';

    //Check if the SKU does exist
    const sku = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.menu_item', 'menuItem')
      .where('sku.sku_id = :sku_id', { sku_id })
      .getOne();
    if (!sku) {
      throw new HttpException('SKU does not exist', 404);
    }

    //Check the package info does belongs to the SKU
    if (packaging_id) {
      if (!(await this.checkIfThePackageBelongsToSKU(packaging_id, sku_id))) {
        throw new HttpException(
          'The package info does belongs to the SKU',
          400,
        );
      }
    }

    // Check if the advanced_taste_customization_obj is all available to this SKU
    const advancedTasteCustomizationValidation =
      advanced_taste_customization_obj.length > 0
        ? await this.commonService.validateAdvacedTasteCustomizationObjWithMenuItem(
            advanced_taste_customization_obj,
            sku.menu_item_id,
          )
        : { isValid: true, message: '' };
    if (!advancedTasteCustomizationValidation.isValid) {
      throw new HttpException(
        advancedTasteCustomizationValidation.message,
        400,
      );
    }

    // Check if the basic_taste_customization_obj is all available to this SKU
    const basicTasteCustomizationValidation =
      basic_taste_customization_obj.length > 0
        ? await this.commonService.validateBasicTasteCustomizationObjWithMenuItem(
            basic_taste_customization_obj,
            sku.menu_item_id,
          )
        : { isValid: true, message: '' };
    if (!basicTasteCustomizationValidation.isValid) {
      throw new HttpException(basicTasteCustomizationValidation.message, 400);
    }

    //Get the current cart
    const currentCart = await this.getCart(customer_id);

    //Interpret Advance Taste Customization
    const advanced_taste_customization =
      advanced_taste_customization_obj.length > 0
        ? await this.commonService.interpretAdvanceTaseCustomization(
            advanced_taste_customization_obj,
            lang,
          )
        : '';

    //Interpret Basic  Taste Customization
    const basic_taste_customization =
      basic_taste_customization_obj.length > 0
        ? await this.commonService.interpretBasicTaseCustomization(
            basic_taste_customization_obj,
            lang,
          )
        : '';

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
        packaging_id,
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
        i.basic_taste_customization_obj == basic_taste_customization_obj_txt &&
        i.notes == notes &&
        i.packaging_info.packaging_id == packaging_id,
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
        existingItem.packaging_info.packaging_id,
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
      packaging_id,
    );
    return await this.getCart(customer_id);
  } // end of addCartItem

  async getCart(customer_id: number): Promise<FullCartItem[]> {
    const fullCart: FullCartItem[] = [];
    const cartItems = await this.entityManager
      .createQueryBuilder(CartItem, 'cart')
      .leftJoinAndSelect('cart.packaging_obj', 'packaging')
      .leftJoinAndSelect('packaging.packaging_ext_obj', 'packagingExt')
      .where('cart.customer_id = :customer_id', { customer_id })
      .getMany();

    const additionalInfoForSkus =
      await this.commonService.getAdditionalInfoForSkus(
        cartItems.map((i) => i.sku_id),
      );

    for (const item of cartItems) {
      const additionalInfoForSku = additionalInfoForSkus.find(
        (i) => i.sku_id == item.sku_id,
      );
      const packagingInfo: CartPackagingInfo = {
        packaging_id: item.packaging_id,
        name: [],
        price: item.packaging_obj?.price,
      };
      item.packaging_obj?.packaging_ext_obj.forEach((ext) => {
        packagingInfo.name.push({
          ISO_language_code: ext.ISO_language_code,
          text: ext.name,
        });
      });
      const fullItem: FullCartItem = {
        item_id: item.item_id,
        item_name: additionalInfoForSku.sku_name,
        item_img: additionalInfoForSku.sku_img,
        customer_id: item.customer_id,
        sku_id: item.sku_id,
        menu_item_id: additionalInfoForSku.menu_item_id,
        quantity_available: additionalInfoForSku.quantity_available,
        price: additionalInfoForSku.sku_price,
        price_after_discount: additionalInfoForSku.sku_price_after_discount,
        unit: additionalInfoForSku.sku_unit,
        qty_ordered: item.qty_ordered,
        advanced_taste_customization: item.advanced_taste_customization,
        basic_taste_customization: item.basic_taste_customization,
        portion_customization: item.portion_customization,
        advanced_taste_customization_obj: item.advanced_taste_customization_obj,
        basic_taste_customization_obj: item.basic_taste_customization_obj,
        notes: item.notes,
        restaurant_id: item.restaurant_id,
        packaging_info: packagingInfo,
      };
      fullCart.push(fullItem);
    }
    return fullCart;
  } // end of getCart

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
    packaging_id: number,
  ): Promise<void> {
    //A. Check if the updated quantity is more than avaialbe quantity
    const menuItemId = (
      await this.entityManager
        .createQueryBuilder(SKU, 'sku')
        .where('sku.sku_id = :sku_id', { sku_id })
        .getOne()
    ).menu_item_id;

    //A1.Get availble quantity
    const availableQty = (
      await this.entityManager
        .createQueryBuilder(MenuItem, 'menuIem')
        .where('menuIem.menu_item_id = :menuItemId', { menuItemId })
        .getOne()
    ).quantity_available;

    //A2. summary ordered quantity
    const orderedQuantityFromCurrentCartIem = +(
      await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .leftJoinAndSelect('cart.sku_obj', 'sku')
        .where('cart.customer_id = :customer_id', {
          customer_id,
        })
        .andWhere('sku.menu_item_id = :menuItemId', {
          menuItemId,
        })
        .select('SUM(cart.qty_ordered)', 'sum')
        .getRawOne()
    ).sum;
    const summaryOrderedQuantity =
      orderedQuantityFromCurrentCartIem + qty_ordered;

    //A3. Compare Ordered Quanty TO Available Quantity
    if (summaryOrderedQuantity > availableQty) {
      throw new HttpException(
        'Cannot insert more than available quantity',
        400,
      );
    }

    //B. Insert database
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
        packaging_id: packaging_id,
      })
      .execute();
  } // end of insertCart

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
    packaging_id: number,
  ): Promise<void> {
    //A. Check if the updated quantity is more than avaialbe quantity
    const menuItemId = (
      await this.entityManager
        .createQueryBuilder(SKU, 'sku')
        .where('sku.sku_id = :sku_id', { sku_id })
        .getOne()
    ).menu_item_id;

    //A1.Get availble quantity
    const availableQty = (
      await this.entityManager
        .createQueryBuilder(MenuItem, 'menuIem')
        .where('menuIem.menu_item_id = :menuItemId', { menuItemId })
        .getOne()
    ).quantity_available;

    //A2. summary ordered quantity
    const orderedQuantityFromOtherCartIem = +(
      await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .leftJoinAndSelect('cart.sku_obj', 'sku')
        .where('cart.customer_id = :customer_id', {
          customer_id,
        })
        .andWhere('cart.item_id != :item_id', { item_id })
        .andWhere('sku.menu_item_id = :menuItemId', {
          menuItemId,
        })
        .select('SUM(cart.qty_ordered)', 'sum')
        .getRawOne()
    ).sum;
    const summaryOrderedQuantity =
      orderedQuantityFromOtherCartIem + qty_ordered;

    //A3. Compare Ordered Quanty TO Available Quantity
    if (summaryOrderedQuantity > availableQty) {
      throw new HttpException(
        'Cannot insert more than available quantity',
        400,
      );
    }

    //B. Update database
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
        packaging_id: packaging_id,
      })
      .where('item_id = :item_id', { item_id })
      .execute();
  } // end of updateCart

  async updateCartAdvancedFromEndPoint(
    customer_id: number,
    item_id: number,
    sku_id: number,
    qty_ordered: number,
    advanced_taste_customization_obj: OptionSelection[],
    basic_taste_customization_obj: BasicTasteSelection[],
    notes: string,
    packaging_id: number,
    lang: string,
  ): Promise<FullCartItem[]> {
    // https://n-festa.atlassian.net/browse/FES-28

    // Get the corresponding cart items in DB
    const mentionedCartItem = (
      await this.getCartByItemId([item_id], customer_id)
    )[0];
    if (!mentionedCartItem) {
      throw new HttpException(
        'Cart item does not belong to the customer or not exist',
        404,
      );
    }

    // Check if the package does belong to SKU
    if (packaging_id) {
      if (!(await this.checkIfThePackageBelongsToSKU(packaging_id, sku_id))) {
        throw new HttpException('The package does not belong to SKU', 400);
      }
    }

    const advanced_taste_customization_obj_txt =
      advanced_taste_customization_obj.length > 0
        ? JSON.stringify(advanced_taste_customization_obj)
        : '';
    const basic_taste_customization_obj_txt =
      basic_taste_customization_obj.length > 0
        ? JSON.stringify(basic_taste_customization_obj)
        : '';

    // const advanced_taste_customization_obj_txt = JSON.stringify(
    //   advanced_taste_customization_obj,
    // );
    // const basic_taste_customization_obj_txt = JSON.stringify(
    //   basic_taste_customization_obj,
    // );

    //Check if there any new data
    if (
      sku_id == mentionedCartItem.sku_id &&
      qty_ordered == mentionedCartItem.qty_ordered &&
      advanced_taste_customization_obj_txt ==
        mentionedCartItem.advanced_taste_customization_obj &&
      basic_taste_customization_obj_txt ==
        mentionedCartItem.basic_taste_customization_obj &&
      notes == mentionedCartItem.notes &&
      packaging_id == mentionedCartItem.packaging_id
    ) {
      throw new HttpException('No new data for updating', 400);
    }

    //Check if the SKU does exist
    const sku = await this.entityManager
      .createQueryBuilder(SKU, 'sku')
      .leftJoinAndSelect('sku.menu_item', 'menuItem')
      .where('sku.sku_id = :sku_id', { sku_id: sku_id })
      .getOne();
    if (!sku) {
      throw new HttpException('SKU does not exist', 404);
    }

    // If there is any other cart item which is IDENTICAL to the updated item
    const identicalCartItem = await this.entityManager
      .createQueryBuilder(CartItem, 'cart')
      .where('cart.customer_id = :customer_id', { customer_id })
      .andWhere('cart.item_id != :item_id', { item_id })
      .andWhere('cart.sku_id = :sku_id', { sku_id })
      .andWhere(
        'cart.advanced_taste_customization_obj = :advanced_taste_customization_obj',
        {
          advanced_taste_customization_obj:
            advanced_taste_customization_obj_txt,
        },
      )
      .andWhere(
        'cart.basic_taste_customization_obj = :basic_taste_customization_obj',
        { basic_taste_customization_obj: basic_taste_customization_obj_txt },
      )
      .andWhere('cart.notes = :notes', { notes })
      .andWhere('cart.packaging_id = :packaging_id', { packaging_id })
      .getOne();

    if (identicalCartItem) {
      //The item does exist
      // => DELETE the updated item & Update the identical item with the increased quantity

      await this.updateCartWhenIdenticalItemFound(
        item_id,
        qty_ordered,
        identicalCartItem,
      );
      // await this.entityManager.transaction(
      //   async (transactionalEntityManager) => {
      //     //DELETE the updated item
      //     await transactionalEntityManager
      //       .createQueryBuilder()
      //       .delete()
      //       .from(CartItem)
      //       .where('item_id = :item_id', { item_id })
      //       .execute();
      //     // Update the identical item with the increased quantity
      //     await transactionalEntityManager
      //       .createQueryBuilder()
      //       .update(CartItem)
      //       .set({
      //         qty_ordered: identicalCartItem.qty_ordered + qty_ordered,
      //       })
      //       .where('item_id = :item_id', {
      //         item_id: identicalCartItem.item_id,
      //       })
      //       .execute();
      //   },
      // );

      return await this.getCart(customer_id);
    }

    //Generate advanced_taste_customization, basic_taste_customization and portion_customization
    let advanced_taste_customization: string = '';
    let basic_taste_customization: string = '';
    let portion_customization: string = '';

    if (sku_id != mentionedCartItem.sku_id) {
      // --- DIFFERENT SKU ---

      //Check if a new SKU belongs to the current Menu Item of the current Cart Item
      const isAllowedSku = await this.commonService.checkIfSkuHasSameMenuItem([
        sku_id,
        mentionedCartItem.sku_id,
      ]);

      if (!isAllowedSku) {
        throw new HttpException(
          `Updated sku_id ${sku_id} does not have the same Menu Item as the current mentioning sku_id`,
          400,
        );
      }

      //Interpret Portion Customization
      portion_customization =
        await this.commonService.interpretPortionCustomization(sku_id, lang);
    } else if (sku_id == mentionedCartItem.sku_id) {
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
          advanced_taste_customization_obj,
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
          advanced_taste_customization_obj,
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
          basic_taste_customization_obj,
          sku.menu_item_id,
        );
      if (!basicTasteCustomizationValidation.isValid) {
        throw new HttpException(basicTasteCustomizationValidation.message, 400);
      }
      //Interpret Basic  Taste Customization
      basic_taste_customization =
        await this.commonService.interpretBasicTaseCustomization(
          basic_taste_customization_obj,
          lang,
        );
    } else if (
      basic_taste_customization_obj_txt ==
      mentionedCartItem.basic_taste_customization_obj
    ) {
      // --- Same basic taste customization ---
      basic_taste_customization = mentionedCartItem.basic_taste_customization;
    }

    await this.updateCart(
      item_id,
      customer_id,
      sku_id,
      qty_ordered,
      advanced_taste_customization,
      basic_taste_customization,
      portion_customization,
      advanced_taste_customization_obj_txt,
      basic_taste_customization_obj_txt,
      notes,
      mentionedCartItem.restaurant_id,
      packaging_id,
    );

    return await this.getCart(customer_id);
  } // end of updateCartAdvancedFromEndPoint

  async getCartByItemId(item_ids: number[], customer_id) {
    return await this.entityManager
      .createQueryBuilder(CartItem, 'cart')
      .where('cart.customer_id = :customer_id', { customer_id })
      .andWhere('cart.item_id IN (:...item_ids)', { item_ids })
      .getMany();
  } // end of getCartByItemId

  async massUpdateCartItem(cart_items: CartItem[]): Promise<void> {
    //Only do the mass updating if the udated sku has the same as the sku of the current item
    await this.entityManager.transaction(async (transactionalEntityManager) => {
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
    });
  } // end of massUpdateCartItem

  async updateCartBasicFromEndPoint(
    customer_id: number,
    quantity_updated_items: QuantityUpdatedItem[],
  ): Promise<FullCartItem[]> {
    // https://n-festa.atlassian.net/browse/FES-28
    // quantity_updated_items cannot be empty
    if (!quantity_updated_items || quantity_updated_items.length <= 0) {
      throw new HttpException('The updated_items cannot be empty', 400);
    }

    // Get the corresponding cart items in DB
    const mentionedCartItems = await this.getCartByItemId(
      quantity_updated_items.map((i) => i.item_id),
      customer_id,
    );
    // The list of updated items must belong to the customer
    if (mentionedCartItems.length != quantity_updated_items.length) {
      throw new HttpException(
        'Some of cart items do not belong to the customer or not exist',
        404,
      );
    }

    // The quantity must be greater than 0
    const isQuantityValid = quantity_updated_items.find(
      (i) => !Boolean(i.qty_ordered > 0),
    );
    if (isQuantityValid) {
      throw new HttpException(
        'The quantity cannot be negative or different from number',
        400,
      );
    }

    // MASS UPDATE
    await this.massUpdateCartItemWithQuantity(quantity_updated_items);

    return await this.getCart(customer_id);
  } // end of updateCartBasicFromEndPoint

  async massUpdateCartItemWithQuantity(
    items: QuantityUpdatedItem[],
  ): Promise<void> {
    //A. Check the updated quantity is more than avaialbe quantity

    const cartItemIds = items.map((i) => i.item_id);
    const updatingCartItems = await this.entityManager
      .createQueryBuilder(CartItem, 'cartItem')
      .leftJoinAndSelect('cartItem.sku_obj', 'sku')
      .where('cartItem.item_id IN (:...ids)', { ids: cartItemIds })
      .getMany();
    const customerIds = updatingCartItems
      .map((i) => i.customer_id)
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

    //A1. Get the available quantity
    const updatedMenuItemIds = updatingCartItems
      .map((i) => i.sku_obj.menu_item_id)
      .filter((value, index, self) => {
        return self.indexOf(value) === index;
      });

    const avaialbeQuantity: number = +(
      await this.entityManager
        .createQueryBuilder(MenuItem, 'menuItem')
        .where('menuItem.menu_item_id IN (:...ids)', {
          ids: updatedMenuItemIds,
        })
        .select('SUM(menuItem.quantity_available)', 'sum')
        .getRawOne()
    ).sum;

    //A2. Get quatity ordered after updating
    //A2i. Apart from updating cart item, we get list of cart item
    //     which belongs to above list of menu item
    //     Then sum the ordered quantity
    const orderedQuantityFromOtherCartIem = +(
      await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .leftJoinAndSelect('cart.sku_obj', 'sku')
        .where('cart.item_id NOT IN (:...ids)', {
          ids: cartItemIds,
        })
        .andWhere('cart.customer_id IN (:...customerIds)', {
          customerIds,
        })
        .andWhere('sku.menu_item_id IN (:...updatedMenuItemIds)', {
          updatedMenuItemIds,
        })
        .select('SUM(cart.qty_ordered)', 'sum')
        .getRawOne()
    ).sum;

    //A2ii. Summary the ordered quantity from updating cart item
    const updatingOrderedQuantity = items
      .map((i) => i.qty_ordered)
      .reduce((sum, quantity) => {
        return sum + quantity;
      });

    //A2iii. Summary ordered quantity
    const orderedQuantity =
      orderedQuantityFromOtherCartIem + updatingOrderedQuantity;

    //A3. Compare ordered quanty TO available quantity
    if (orderedQuantity > avaialbeQuantity) {
      throw new HttpException(
        'The updated quantity is more than available quantity',
        400,
      );
    }

    //B. Update data
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      for (const item of items) {
        await transactionalEntityManager
          .createQueryBuilder()
          .update(CartItem)
          .set({
            qty_ordered: item.qty_ordered,
          })
          .where('item_id = :item_id', { item_id: item.item_id })
          .execute();
      }
    });
  } //end of massUpdateCartItemWithQuantity

  async deleteAllCartItem(customer_id: number) {
    await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .where('customer_id = :customer_id', { customer_id })
      .execute();
  } // end of deleteAllCartItem

  async deleteCartItemsFromEndPoint(
    customer_id: number,
    item_ids: number[],
  ): Promise<FullCartItem[]> {
    //Check if the item_ids belongs to the customers
    const mentionedCartItems = await this.getCartByItemId(
      item_ids,
      customer_id,
    );
    if (mentionedCartItems.length != item_ids.length) {
      throw new HttpException(
        'Some of cart items do not belong to the customer or not exist',
        404,
      );
    }

    //Delete the cart items
    await this.deleteCartItems(item_ids);

    //Get the cart again after deleting the cart items
    return await this.getCart(customer_id);
  } // end of deleteCartItemsFromEndPoint

  async deleteCartItems(item_ids: number[]): Promise<void> {
    await this.entityManager
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .whereInIds(item_ids)
      .execute();
  } // end of deleteCartItems

  async getAvailableDeliveryTimeFromEndPoint(
    menu_item_ids: number[],
    now: number,
    long: number,
    lat: number,
    utc_offset: number,
    having_advanced_customization: boolean,
    buffer_s = 5 * 60, // 5 mins
  ): Promise<TimeSlot[]> {
    const timeSlots = [];

    const availableDeliveryTime: TimeRange[] =
      await this.commonService.getAvailableDeliveryTime(
        menu_item_ids,
        now,
        long,
        lat,
        having_advanced_customization,
      );

    //convert time ranges to time slots
    for (const timeRange of availableDeliveryTime) {
      const convertData = this.commonService.convertTimeRangeToTimeSlot(
        timeRange,
        utc_offset,
      );
      convertData.forEach((i) => timeSlots.push(i));
    }
    return timeSlots;
  } // end of getAvailableDeliveryTimeFromEndPoint

  async checkIfThePackageBelongsToSKU(
    packaging_id: number,
    sku_id: number,
  ): Promise<boolean> {
    let result = false;

    const record = await this.entityManager
      .createQueryBuilder(MenuItemPackaging, 'packaging')
      .leftJoinAndSelect('packaging.menu_item_obj', 'menuItem')
      .leftJoinAndSelect('menuItem.skus', 'sku')
      .where('packaging.packaging_id = :packaging_id', { packaging_id })
      .andWhere('sku.sku_id = :sku_id', { sku_id })
      .getOne();

    result = record ? true : false;

    return result;
  } // end of checkIfThePackageBelongsToSKU

  async updateCartWhenIdenticalItemFound(
    cart_item_id: number,
    updated_qty: number,
    idential_item: CartItem,
  ): Promise<void> {
    //A. Check if the updated quantity is more than avaialbe quantity
    const menuItemId = (
      await this.entityManager
        .createQueryBuilder(SKU, 'sku')
        .where('sku.sku_id = :sku_id', { sku_id: idential_item.sku_id })
        .getOne()
    ).menu_item_id;

    //A1.Get availble quantity
    const availableQty = (
      await this.entityManager
        .createQueryBuilder(MenuItem, 'menuIem')
        .where('menuIem.menu_item_id = :menuItemId', { menuItemId })
        .getOne()
    ).quantity_available;

    //A2. summary ordered quantity
    const orderedQuantityFromOtherCartIem = +(
      await this.entityManager
        .createQueryBuilder(CartItem, 'cart')
        .leftJoinAndSelect('cart.sku_obj', 'sku')
        .where('cart.customer_id = :customer_id', {
          customer_id: idential_item.customer_id,
        })
        .andWhere('cart.item_id != :item_id', { item_id: cart_item_id })
        .andWhere('sku.menu_item_id = :menuItemId', {
          menuItemId,
        })
        .select('SUM(cart.qty_ordered)', 'sum')
        .getRawOne()
    ).sum;
    const summaryOrderedQuantity =
      orderedQuantityFromOtherCartIem + updated_qty;

    //A3. Compare Ordered Quanty TO Available Quantity
    if (summaryOrderedQuantity > availableQty) {
      throw new HttpException(
        'Cannot insert more than available quantity',
        400,
      );
    }

    //B. Update Database
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      //DELETE the updated item
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(CartItem)
        .where('item_id = :item_id', { item_id: cart_item_id })
        .execute();
      // Update the identical item with the increased quantity
      await transactionalEntityManager
        .createQueryBuilder()
        .update(CartItem)
        .set({
          qty_ordered: idential_item.qty_ordered + updated_qty,
        })
        .where('item_id = :item_id', {
          item_id: idential_item.item_id,
        })
        .execute();
    });
  } //end of updateCartWhenIdenticalItemFound
}
