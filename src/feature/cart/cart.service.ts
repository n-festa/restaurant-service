import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { FlagsmithService } from 'src/dependency/flagsmith/flagsmith.service';
import { EntityManager } from 'typeorm';
import { CartItem } from 'src/entity/cart-item.entity';
import { CommonService } from '../common/common.service';
import { SKU } from 'src/entity/sku.entity';
import {
  BasicTasteSelection,
  Coordinate,
  DayShift,
  OptionSelection,
  QuantityUpdatedItem,
  ThisDate,
  TimeRange,
  TimeSlot,
} from 'src/type';
import { DAY_ID, DAY_NAME } from 'src/constant';
import { Shift } from 'src/enum';
import { AhamoveService } from 'src/dependency/ahamove/ahamove.service';

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
    qty_ordered: number,
    advanced_taste_customization_obj: OptionSelection[],
    basic_taste_customization_obj: BasicTasteSelection[],
    notes: string,
    lang: string = 'vie',
  ): Promise<CartItem[]> {
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
        i.basic_taste_customization_obj == basic_taste_customization_obj_txt &&
        i.notes == notes,
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
  } // end of addCartItem

  async getCart(customer_id: number): Promise<CartItem[]> {
    return await this.entityManager
      .createQueryBuilder(CartItem, 'cart')
      .where('cart.customer_id = :customer_id', { customer_id })
      .getMany();
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
  ): Promise<void> {
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
  ): Promise<void> {
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
  } // end of updateCart

  async updateCartAdvancedFromEndPoint(
    customer_id: number,
    item_id: number,
    sku_id: number,
    qty_ordered: number,
    advanced_taste_customization_obj: OptionSelection[],
    basic_taste_customization_obj: BasicTasteSelection[],
    notes: string,
    lang: string,
  ): Promise<CartItem[]> {
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

    const advanced_taste_customization_obj_txt = JSON.stringify(
      advanced_taste_customization_obj,
    );
    const basic_taste_customization_obj_txt = JSON.stringify(
      basic_taste_customization_obj,
    );

    //Check if there any new data
    if (
      sku_id == mentionedCartItem.sku_id &&
      qty_ordered == mentionedCartItem.qty_ordered &&
      advanced_taste_customization_obj_txt ==
        mentionedCartItem.advanced_taste_customization_obj &&
      basic_taste_customization_obj_txt ==
        mentionedCartItem.basic_taste_customization_obj &&
      notes == mentionedCartItem.notes
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

    // If there is any cart item which is IDENTICAL to the updated item
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
      .getOne();

    if (identicalCartItem) {
      //The item does exist
      // => DELETE the updated item & Update the identical item with the increased quantity

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          //DELETE the updated item
          await transactionalEntityManager
            .createQueryBuilder()
            .delete()
            .from(CartItem)
            .where('item_id = :item_id', { item_id })
            .execute();
          // Update the identical item with the increased quantity
          await transactionalEntityManager
            .createQueryBuilder()
            .update(CartItem)
            .set({
              qty_ordered: identicalCartItem.qty_ordered + qty_ordered,
            })
            .where('item_id = :item_id', {
              item_id: identicalCartItem.item_id,
            })
            .execute();
        },
      );

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
  ): Promise<CartItem[]> {
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
  ): Promise<CartItem[]> {
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
    buffer_s = 5 * 60, // 5 mins
  ): Promise<TimeSlot[]> {
    const timeSlots = [];

    const menuItems = await this.commonService.getMenuItemByIds(menu_item_ids);

    //Check if menu_item_ids do exist
    if (menuItems.length != menu_item_ids.length) {
      throw new HttpException('Some of menu items do not exist', 404);
    }

    //Check if menu_item_ids belong to the same restaurant
    const restaurantId = menuItems[0].restaurant_id;
    if (menuItems.find((i) => i.restaurant_id != restaurantId)) {
      throw new HttpException(
        'Some of menu items do not belong to the same restaurant',
        400,
      );
    }

    //get the delivery time
    const delivery_time_s = (
      await this.commonService.estimateTimeAndDistanceForRestaurant(
        restaurantId,
        long,
        lat,
      )
    ).duration_s;
    if (!delivery_time_s) {
      throw new HttpException(
        'There some error with the delivery estimation',
        500,
      );
    }

    const restaurantUtcTimeZone =
      await this.commonService.getUtcTimeZone(restaurantId);
    const timeZoneOffset = restaurantUtcTimeZone * 60 * 60 * 1000; // Offset in milliseconds for EST

    const localTodayId = new Date(now + timeZoneOffset).getUTCDay() + 1; // 1->7: Sunday -> Saturday

    //Find the schedule in which all of the menu items are available
    const overlapSchedule: DayShift[] = [];
    for (let index = localTodayId - 1; index < DAY_ID.length; index++) {
      const localTodayId = DAY_ID[index];
      overlapSchedule.push({
        day_id: localTodayId,
        day_name: DAY_NAME[index],
        from: Shift.MorningFrom,
        to: Shift.MorningTo,
        is_available: true,
        waiting_time_s: 0,
      });
      overlapSchedule.push({
        day_id: localTodayId,
        day_name: DAY_NAME[index],
        from: Shift.AfternoonFrom,
        to: Shift.AfternoonTo,
        is_available: true,
        waiting_time_s: 0,
      });
      overlapSchedule.push({
        day_id: localTodayId,
        day_name: DAY_NAME[index],
        from: Shift.NightFrom,
        to: Shift.NightTo,
        is_available: true,
        waiting_time_s: 0,
      });
    }
    for (const menuItem of menuItems) {
      const menuItemSchedule: DayShift[] = JSON.parse(
        menuItem.cooking_schedule,
      );
      for (const dayShift of menuItemSchedule) {
        const index = overlapSchedule.findIndex(
          (i) => i.day_id == dayShift.day_id && i.from == dayShift.from,
        );
        if (index == -1) {
          //cannot find the same day shift in overlapSchedule
          continue;
        }
        if (dayShift.is_available == false) {
          overlapSchedule[index].is_available = false;
        } else if (
          dayShift.is_available == true &&
          overlapSchedule[index].is_available == true
        ) {
          if (dayShift.cutoff_time) {
            const waiting_time_s =
              this.commonService.convertTimeToSeconds(dayShift.cutoff_time) +
              menuItem.cooking_time_s -
              this.commonService.convertTimeToSeconds(dayShift.from);
            if (waiting_time_s > overlapSchedule[index].waiting_time_s) {
              overlapSchedule[index].waiting_time_s = waiting_time_s;
            }
          }
        }
      }
    }

    //build datesOfThisWeek => only for performance purpose
    const datesOfThisWeek: ThisDate[] = [];
    for (let index = localTodayId - 1; index < DAY_ID.length; index++) {
      const localTodayId = DAY_ID[index];
      datesOfThisWeek.push(
        this.commonService.getThisDate(now, localTodayId, timeZoneOffset),
      );
    }

    // Convert the schedule to TimeSlot format (1)
    const menuItemAvailableTimeRanges: TimeRange[] = [];
    for (const dayShift of overlapSchedule) {
      if (dayShift.is_available == false) {
        continue;
      }
      const thisDate = datesOfThisWeek.find((i) => i.dayId == dayShift.day_id);
      let from: number = 0;
      let to: number = 0;
      switch (dayShift.from) {
        case Shift.MorningFrom:
          from =
            new Date(thisDate.date).setUTCHours(6, 0, 0, 0) - timeZoneOffset;
          to = from + 8 * 60 * 60 * 1000 - 1000;
          break;
        case Shift.AfternoonFrom:
          from =
            new Date(thisDate.date).setUTCHours(14, 0, 0, 0) - timeZoneOffset;
          to = from + 8 * 60 * 60 * 1000 - 1000;
          break;
        case Shift.NightFrom:
          from =
            new Date(thisDate.date).setUTCHours(22, 0, 0, 0) - timeZoneOffset;
          to = from + 8 * 60 * 60 * 1000 - 1000;
          break;

        default:
          throw new HttpException(
            'Unknown error with dayShift of function getAvailableDeliveryTimeFromEndPoint',
            500,
          );
      }
      menuItemAvailableTimeRanges.push({
        from: from + dayShift.waiting_time_s * 1000,
        to: to,
      });
    }

    // Get operation data of the restaurant
    const fromTomorrowOpsHours = (
      await this.commonService.getRestaurantOperationHours(restaurantId)
    ).filter((i) => i.day_of_week > localTodayId);

    //Get the day off data from the table Restaurant_Day_Off with restaurant_id
    let dayOffs = await this.commonService.getAvailableRestaurantDayOff(
      restaurantId,
      now,
    );
    //Only keep the day off for this week
    if (dayOffs.length > 0) {
      const thisSaturday = this.commonService.getThisDate(
        now,
        7,
        timeZoneOffset,
      );
      dayOffs = dayOffs.filter((i) => i.date <= new Date(thisSaturday.date));
    }
    // filter the operation data above with the day off data
    dayOffs.forEach((i) => {
      const index = fromTomorrowOpsHours.findIndex(
        (j) => j.day_of_week == i.date.getUTCDay() + 1,
      );
      if (index != -1) {
        fromTomorrowOpsHours.splice(index, 1);
      }
    });

    //convert fromTomorrowOpsHours to time ranges
    const fromTomorrowOperationTimeRanges: TimeRange[] = [];
    for (const opsHour of fromTomorrowOpsHours) {
      const [fromHours, fromMinutes, fromSeconds] = opsHour.from_time
        .split(':')
        .map((i) => parseInt(i));
      const [toHours, toMinutes, toSeconds] = opsHour.to_time
        .split(':')
        .map((i) => parseInt(i));
      const thisDate = datesOfThisWeek.find(
        (i) => i.dayId == opsHour.day_of_week,
      );

      fromTomorrowOperationTimeRanges.push({
        from:
          new Date(thisDate.date).setUTCHours(
            fromHours,
            fromMinutes,
            fromSeconds,
          ) - timeZoneOffset,
        to:
          new Date(thisDate.date).setUTCHours(toHours, toMinutes, toSeconds) -
          timeZoneOffset,
      });
    }

    const todayOperationTimeRange = await this.commonService.getTodayOpsTime(
      restaurantId,
      now,
    );

    //Build restaurantAvailabeTimeRanges
    const restaurantAvailabeTimeRanges: TimeRange[] = [];
    restaurantAvailabeTimeRanges.push(...fromTomorrowOperationTimeRanges);
    if (todayOperationTimeRange) {
      restaurantAvailabeTimeRanges.push(todayOperationTimeRange);
    }

    //find the overlap time ranges between menuItemAvailableTimeRanges and restaurantAvailabeTimeRanges
    const foodAvailabeTimeRanges: TimeRange[] = [];
    for (const menuItemAvailableTimeRange of menuItemAvailableTimeRanges) {
      for (const restaurantAvailabeTimeRange of restaurantAvailabeTimeRanges) {
        const overlapTimeRange = this.commonService.getOverlappingTimeRange(
          menuItemAvailableTimeRange,
          restaurantAvailabeTimeRange,
        );
        if (overlapTimeRange) {
          foodAvailabeTimeRanges.push(overlapTimeRange);
        }
      }
    }

    //get the longest prepraring time for all the menu items
    const listOfPreparingTime = menuItems.map((i) => i.preparing_time_s);
    const longestPreparingTime = Math.max(...listOfPreparingTime);

    //buil the AvailableDeliveryTime
    //adjust the time ranges with
    // - delivery time
    // - preparing_time (the longest preparing time of all menu items)
    // - buffer (5 mins)
    // - now
    const availableDeliveryTime: TimeRange[] = [];
    foodAvailabeTimeRanges.forEach((foodTimeRange) => {
      let from = 0;
      if (foodTimeRange.from < now) {
        from = now;
      } else if (foodTimeRange.from >= now) {
        from = foodTimeRange.from;
      }
      const timeRange: TimeRange = {
        from: from + (longestPreparingTime + delivery_time_s + buffer_s) * 1000,
        to:
          foodTimeRange.to +
          (longestPreparingTime + delivery_time_s + buffer_s) * 1000,
      };
      availableDeliveryTime.push(timeRange);
    });

    //convert time ranges to time slots
    for (const timeRange of availableDeliveryTime) {
      const convertData = this.commonService.convertTimeRangeToTimeSlot(
        timeRange,
        utc_offset,
      );
      convertData.forEach((i) => timeSlots.push(i));
    }
    return timeSlots;
  }
}
